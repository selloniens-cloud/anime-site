const Joi = require('joi');
const { HTTP_STATUS, LIMITS, REGEX } = require('../../shared/constants/constants');

// Общая функция валидации
const validate = (schema) => {
  return (req, res, next) => {
    console.log('🔍 VALIDATION DEBUG - Request body:', req.body);
    console.log('🔍 VALIDATION DEBUG - Schema name:', schema._flags?.label || 'unknown');
    
    const { error } = schema.validate(req.body, {
      abortEarly: false, // Показать все ошибки
      allowUnknown: true, // Разрешить неизвестные поля
      stripUnknown: true // Удалить неизвестные поля
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.log('🔍 VALIDATION DEBUG - Validation failed:', errors);

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Ошибка валидации данных',
          details: errors
        }
      });
    }

    console.log('🔍 VALIDATION DEBUG - Validation passed');
    next();
  };
};

// Валидация параметров запроса
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Неверные параметры запроса',
          details: error.details[0].message
        }
      });
    }

    next();
  };
};

// Валидация query параметров
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Неверные параметры запроса',
          details: error.details[0].message
        }
      });
    }

    req.query = value;
    next();
  };
};

// Схемы валидации для аутентификации
const authSchemas = {
  register: Joi.object({
    username: Joi.string()
      .min(LIMITS.USERNAME_MIN_LENGTH)
      .max(LIMITS.USERNAME_MAX_LENGTH)
      .pattern(REGEX.USERNAME)
      .required()
      .messages({
        'string.min': `Имя пользователя должно содержать минимум ${LIMITS.USERNAME_MIN_LENGTH} символа`,
        'string.max': `Имя пользователя не должно превышать ${LIMITS.USERNAME_MAX_LENGTH} символов`,
        'string.pattern.base': 'Имя пользователя может содержать только буквы, цифры и подчеркивания',
        'any.required': 'Имя пользователя обязательно'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Введите корректный email адрес',
        'any.required': 'Email обязателен'
      }),
    
    password: Joi.string()
      .min(LIMITS.PASSWORD_MIN_LENGTH)
      .pattern(REGEX.PASSWORD)
      .required()
      .messages({
        'string.min': `Пароль должен содержать минимум ${LIMITS.PASSWORD_MIN_LENGTH} символов`,
        'string.pattern.base': 'Пароль должен содержать буквы и цифры',
        'any.required': 'Пароль обязателен'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Пароли не совпадают',
        'any.required': 'Подтверждение пароля обязательно'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Введите корректный email адрес',
        'any.required': 'Email обязателен'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Пароль обязателен'
      })
  }),

  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Введите корректный email адрес',
        'any.required': 'Email обязателен'
      })
  }),

  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Токен сброса пароля обязателен'
      }),
    
    password: Joi.string()
      .min(LIMITS.PASSWORD_MIN_LENGTH)
      .pattern(REGEX.PASSWORD)
      .required()
      .messages({
        'string.min': `Пароль должен содержать минимум ${LIMITS.PASSWORD_MIN_LENGTH} символов`,
        'string.pattern.base': 'Пароль должен содержать буквы и цифры',
        'any.required': 'Пароль обязателен'
      })
  })
};

// Схемы валидации для пользователей
const userSchemas = {
  updateProfile: Joi.object({
    username: Joi.string()
      .min(LIMITS.USERNAME_MIN_LENGTH)
      .max(LIMITS.USERNAME_MAX_LENGTH)
      .pattern(REGEX.USERNAME)
      .messages({
        'string.min': `Имя пользователя должно содержать минимум ${LIMITS.USERNAME_MIN_LENGTH} символа`,
        'string.max': `Имя пользователя не должно превышать ${LIMITS.USERNAME_MAX_LENGTH} символов`,
        'string.pattern.base': 'Имя пользователя может содержать только буквы, цифры и подчеркивания'
      }),
    
    bio: Joi.string()
      .max(LIMITS.BIO_MAX_LENGTH)
      .allow('')
      .messages({
        'string.max': `Биография не должна превышать ${LIMITS.BIO_MAX_LENGTH} символов`
      }),
    
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto'),
      language: Joi.string().valid('ru', 'en'),
      emailNotifications: Joi.boolean(),
      publicProfile: Joi.boolean()
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Текущий пароль обязателен'
      }),
    
    newPassword: Joi.string()
      .min(LIMITS.PASSWORD_MIN_LENGTH)
      .pattern(REGEX.PASSWORD)
      .required()
      .messages({
        'string.min': `Новый пароль должен содержать минимум ${LIMITS.PASSWORD_MIN_LENGTH} символов`,
        'string.pattern.base': 'Новый пароль должен содержать буквы и цифры',
        'any.required': 'Новый пароль обязателен'
      })
  })
};

// Схемы валидации для комментариев
const commentSchemas = {
  create: Joi.object({
    content: Joi.string()
      .min(1)
      .max(LIMITS.COMMENT_MAX_LENGTH)
      .required()
      .messages({
        'string.min': 'Комментарий не может быть пустым',
        'string.max': `Комментарий не должен превышать ${LIMITS.COMMENT_MAX_LENGTH} символов`,
        'any.required': 'Содержимое комментария обязательно'
      }),
    
    rating: Joi.number()
      .integer()
      .min(LIMITS.MIN_RATING)
      .max(LIMITS.MAX_RATING)
      .messages({
        'number.integer': 'Рейтинг должен быть целым числом',
        'number.min': `Рейтинг должен быть от ${LIMITS.MIN_RATING} до ${LIMITS.MAX_RATING}`,
        'number.max': `Рейтинг должен быть от ${LIMITS.MIN_RATING} до ${LIMITS.MAX_RATING}`
      }),
    
    parentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Неверный ID родительского комментария'
      }),
    
    episodeNumber: Joi.number()
      .integer()
      .min(1)
      .messages({
        'number.integer': 'Номер эпизода должен быть целым числом',
        'number.min': 'Номер эпизода должен быть больше 0'
      }),
    
    tags: Joi.array()
      .items(Joi.string().valid('spoiler', 'review', 'recommendation', 'discussion'))
  }),

  update: Joi.object({
    content: Joi.string()
      .min(1)
      .max(LIMITS.COMMENT_MAX_LENGTH)
      .required()
      .messages({
        'string.min': 'Комментарий не может быть пустым',
        'string.max': `Комментарий не должен превышать ${LIMITS.COMMENT_MAX_LENGTH} символов`,
        'any.required': 'Содержимое комментария обязательно'
      })
  }),

  report: Joi.object({
    reason: Joi.string()
      .valid('spam', 'inappropriate', 'harassment', 'spoiler', 'other')
      .required()
      .messages({
        'any.only': 'Неверная причина жалобы',
        'any.required': 'Причина жалобы обязательна'
      }),
    
    description: Joi.string()
      .max(LIMITS.REPORT_DESCRIPTION_MAX_LENGTH)
      .allow('')
      .messages({
        'string.max': `Описание жалобы не должно превышать ${LIMITS.REPORT_DESCRIPTION_MAX_LENGTH} символов`
      })
  })
};

// Схемы валидации для списков просмотра
const watchListSchemas = {
  addToList: Joi.object({
    status: Joi.string()
      .valid('watching', 'completed', 'planToWatch', 'dropped', 'onHold')
      .required()
      .messages({
        'any.only': 'Неверный статус просмотра',
        'any.required': 'Статус просмотра обязателен'
      }),
    
    rating: Joi.number()
      .integer()
      .min(LIMITS.MIN_RATING)
      .max(LIMITS.MAX_RATING)
      .messages({
        'number.integer': 'Рейтинг должен быть целым числом',
        'number.min': `Рейтинг должен быть от ${LIMITS.MIN_RATING} до ${LIMITS.MAX_RATING}`,
        'number.max': `Рейтинг должен быть от ${LIMITS.MIN_RATING} до ${LIMITS.MAX_RATING}`
      }),
    
    notes: Joi.string()
      .max(LIMITS.NOTES_MAX_LENGTH)
      .allow('')
      .messages({
        'string.max': `Заметки не должны превышать ${LIMITS.NOTES_MAX_LENGTH} символов`
      }),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .messages({
        'any.only': 'Неверный приоритет'
      }),
    
    isPrivate: Joi.boolean()
  }),

  updateProgress: Joi.object({
    episodesWatched: Joi.number()
      .integer()
      .min(0)
      .required()
      .messages({
        'number.integer': 'Количество просмотренных эпизодов должно быть целым числом',
        'number.min': 'Количество просмотренных эпизодов не может быть отрицательным',
        'any.required': 'Количество просмотренных эпизодов обязательно'
      }),
    
    timeWatched: Joi.number()
      .min(0)
      .messages({
        'number.min': 'Время просмотра не может быть отрицательным'
      })
  })
};

// Схемы валидации параметров
const paramSchemas = {
  objectId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Неверный формат ID',
        'any.required': 'ID обязателен'
      })
  }),

  userId: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Неверный формат ID пользователя',
        'any.required': 'ID пользователя обязателен'
      })
  }),

  animeEpisode: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Неверный формат ID аниме',
        'any.required': 'ID аниме обязателен'
      }),
    episodeId: Joi.string()
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.pattern.base': 'Неверный формат номера эпизода',
        'any.required': 'Номер эпизода обязателен'
      })
  })
};

// Схема пагинации (объявляем отдельно для избежания циклических ссылок)
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Номер страницы должен быть целым числом',
      'number.min': 'Номер страницы должен быть больше 0'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(LIMITS.MAX_PAGE_SIZE)
    .default(LIMITS.DEFAULT_PAGE_SIZE)
    .messages({
      'number.integer': 'Лимит должен быть целым числом',
      'number.min': 'Лимит должен быть больше 0',
      'number.max': `Лимит не должен превышать ${LIMITS.MAX_PAGE_SIZE}`
    })
});

// Схемы валидации query параметров
const querySchemas = {
  pagination: paginationSchema,

  animeSearch: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .messages({
        'string.min': 'Поисковый запрос не может быть пустым',
        'string.max': 'Поисковый запрос не должен превышать 100 символов'
      }),
    
    search: Joi.string()
      .min(0)
      .max(100)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Поисковый запрос не должен превышать 100 символов'
      }),
    
    sortBy: Joi.string()
      .valid('title', 'year', 'rating', 'rating.score', 'popularity', 'createdAt')
      .default('rating'),
    
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
    
    rating: Joi.string()
      .allow(''),
    
    genres: Joi.alternatives()
      .try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ),
    
    year: Joi.alternatives()
      .try(
        Joi.number().integer().min(1900).max(new Date().getFullYear() + 5),
        Joi.string().allow('')
      )
      .messages({
        'number.integer': 'Год должен быть целым числом',
        'number.min': 'Год должен быть больше 1900',
        'number.max': 'Год не может быть слишком далеко в будущем'
      }),
    
    status: Joi.string()
      .valid('Finished Airing', 'Currently Airing', 'Not yet aired')
      .allow(''),
    
    type: Joi.string()
      .valid('TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music')
      .allow(''),
    
    sort: Joi.string()
      .valid('title', 'year', 'rating', 'rating.score', 'popularity', 'createdAt')
      .default('rating'),
    
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
  }).concat(paginationSchema)
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  authSchemas,
  userSchemas,
  commentSchemas,
  watchListSchemas,
  paramSchemas,
  querySchemas
};