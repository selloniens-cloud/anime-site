const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  acceptedAt: {
    type: Date
  },
  
  metadata: {
    mutualFriends: {
      type: Number,
      default: 0
    },
    commonAnime: {
      type: Number,
      default: 0
    },
    lastInteraction: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Составной индекс для уникальности пары пользователей
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ status: 1, createdAt: -1 });

// Виртуальные поля
friendshipSchema.virtual('friendshipDuration').get(function() {
  if (this.status === 'accepted' && this.acceptedAt) {
    return Date.now() - this.acceptedAt.getTime();
  }
  return 0;
});

// Middleware для автоматического обновления acceptedAt
friendshipSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'accepted' && !this.acceptedAt) {
    this.acceptedAt = new Date();
  }
  next();
});

// Статические методы
friendshipSchema.statics.sendFriendRequest = async function(requesterId, recipientId) {
  // Проверяем, что пользователи не одинаковые
  if (requesterId.toString() === recipientId.toString()) {
    throw new Error('Нельзя добавить себя в друзья');
  }
  
  // Проверяем, существует ли уже связь
  const existingFriendship = await this.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId }
    ]
  });
  
  if (existingFriendship) {
    if (existingFriendship.status === 'blocked') {
      throw new Error('Нельзя отправить запрос заблокированному пользователю');
    }
    if (existingFriendship.status === 'accepted') {
      throw new Error('Пользователи уже друзья');
    }
    if (existingFriendship.status === 'pending') {
      throw new Error('Запрос в друзья уже отправлен');
    }
  }
  
  // Подсчитываем общих друзей и аниме
  const mutualData = await this.getMutualData(requesterId, recipientId);
  
  const friendship = new this({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending',
    metadata: {
      mutualFriends: mutualData.mutualFriends,
      commonAnime: mutualData.commonAnime,
      lastInteraction: new Date()
    }
  });
  
  return await friendship.save();
};

friendshipSchema.statics.acceptFriendRequest = async function(requesterId, recipientId) {
  const friendship = await this.findOne({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });
  
  if (!friendship) {
    throw new Error('Запрос в друзья не найден');
  }
  
  friendship.status = 'accepted';
  friendship.acceptedAt = new Date();
  friendship.metadata.lastInteraction = new Date();
  
  return await friendship.save();
};

friendshipSchema.statics.rejectFriendRequest = async function(requesterId, recipientId) {
  return await this.findOneAndDelete({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });
};

friendshipSchema.statics.removeFriend = async function(userId1, userId2) {
  return await this.findOneAndDelete({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ],
    status: 'accepted'
  });
};

friendshipSchema.statics.blockUser = async function(blockerId, blockedId) {
  return await this.findOneAndUpdate(
    {
      $or: [
        { requester: blockerId, recipient: blockedId },
        { requester: blockedId, recipient: blockerId }
      ]
    },
    {
      requester: blockerId,
      recipient: blockedId,
      status: 'blocked',
      metadata: { lastInteraction: new Date() }
    },
    { upsert: true, new: true }
  );
};

friendshipSchema.statics.getFriends = function(userId, options = {}) {
  const match = {
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  };
  
  const query = this.find(match);
  
  if (options.populate) {
    query.populate([
      {
        path: 'requester',
        select: 'username avatar bio statistics createdAt'
      },
      {
        path: 'recipient',
        select: 'username avatar bio statistics createdAt'
      }
    ]);
  }
  
  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ acceptedAt: -1 });
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

friendshipSchema.statics.getPendingRequests = function(userId, type = 'received') {
  const match = type === 'received' ? 
    { recipient: userId, status: 'pending' } :
    { requester: userId, status: 'pending' };
    
  return this.find(match)
    .populate([
      { path: 'requester', select: 'username avatar bio statistics' },
      { path: 'recipient', select: 'username avatar bio statistics' }
    ])
    .sort({ createdAt: -1 });
};

friendshipSchema.statics.getFriendshipStatus = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ]
  });
  
  if (!friendship) {
    return 'none';
  }
  
  return friendship.status;
};

friendshipSchema.statics.getMutualData = async function(userId1, userId2) {
  const User = require('./User');
  const WatchList = require('./WatchList');
  
  // Получаем общих друзей
  const user1Friends = await this.getFriends(userId1);
  const user2Friends = await this.getFriends(userId2);
  
  const user1FriendIds = user1Friends.map(f => 
    f.requester.toString() === userId1.toString() ? f.recipient.toString() : f.requester.toString()
  );
  const user2FriendIds = user2Friends.map(f => 
    f.requester.toString() === userId2.toString() ? f.recipient.toString() : f.requester.toString()
  );
  
  const mutualFriends = user1FriendIds.filter(id => user2FriendIds.includes(id)).length;
  
  // Получаем общие аниме
  const user1Anime = await WatchList.find({ userId: userId1 }).select('animeId');
  const user2Anime = await WatchList.find({ userId: userId2 }).select('animeId');
  
  const user1AnimeIds = user1Anime.map(w => w.animeId.toString());
  const user2AnimeIds = user2Anime.map(w => w.animeId.toString());
  
  const commonAnime = user1AnimeIds.filter(id => user2AnimeIds.includes(id)).length;
  
  return { mutualFriends, commonAnime };
};

friendshipSchema.statics.getFriendStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalFriends: { $sum: 1 },
        avgFriendshipDuration: {
          $avg: {
            $subtract: [new Date(), '$acceptedAt']
          }
        }
      }
    }
  ]);
  
  const pendingRequests = await this.countDocuments({
    recipient: userId,
    status: 'pending'
  });
  
  const sentRequests = await this.countDocuments({
    requester: userId,
    status: 'pending'
  });
  
  return {
    totalFriends: stats[0]?.totalFriends || 0,
    avgFriendshipDuration: stats[0]?.avgFriendshipDuration || 0,
    pendingRequests,
    sentRequests
  };
};

// Методы экземпляра
friendshipSchema.methods.getFriend = function(currentUserId) {
  if (this.requester._id.toString() === currentUserId.toString()) {
    return this.recipient;
  } else {
    return this.requester;
  }
};

friendshipSchema.methods.updateLastInteraction = function() {
  this.metadata.lastInteraction = new Date();
  return this.save();
};

module.exports = mongoose.model('Friendship', friendshipSchema);