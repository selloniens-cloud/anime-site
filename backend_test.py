#!/usr/bin/env python3
"""
Backend API Testing for AniLiberty v1 Integration
Tests the Node.js backend API endpoints that integrate with AniLiberty API v1
"""

import requests
import json
import time
import sys
from typing import Dict, List, Any, Optional

# Configuration
BACKEND_BASE_URL = "http://localhost:5000"
API_BASE_URL = f"{BACKEND_BASE_URL}/api"
ANILIBERTY_DIRECT_URL = "https://aniliberty.top/api/v1"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'BackendTester/1.0'
        })
        self.results = []
        
    def log_result(self, test_name: str, success: bool, message: str, data: Any = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'data': data,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if not success and data:
            print(f"   Error details: {data}")
    
    def test_backend_health(self) -> bool:
        """Test if backend server is running"""
        try:
            response = self.session.get(f"{BACKEND_BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Backend Health Check", True, 
                              f"Server is running (uptime: {data.get('uptime', 'unknown')}s)", data)
                return True
            else:
                self.log_result("Backend Health Check", False, 
                              f"Health check failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Backend Health Check", False, f"Cannot connect to backend: {str(e)}")
            return False
    
    def test_anilibria_popular(self) -> bool:
        """Test AniLibria popular anime endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/anilibria/popular?limit=5", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and data.get('data'):
                    anime_list = data['data']
                    if len(anime_list) > 0:
                        # Check structure of first anime
                        first_anime = anime_list[0]
                        required_fields = ['id', 'names']
                        
                        missing_fields = [field for field in required_fields if field not in first_anime]
                        if missing_fields:
                            self.log_result("AniLibria Popular", False, 
                                          f"Missing required fields: {missing_fields}", first_anime)
                            return False
                        
                        self.log_result("AniLibria Popular", True, 
                                      f"Retrieved {len(anime_list)} popular anime", 
                                      {'count': len(anime_list), 'first_anime_id': first_anime.get('id')})
                        return True
                    else:
                        self.log_result("AniLibria Popular", False, "No anime data returned", data)
                        return False
                else:
                    self.log_result("AniLibria Popular", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("AniLibria Popular", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Popular", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_updates(self) -> bool:
        """Test AniLibria updates endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/anilibria/updates?limit=5", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and data.get('data'):
                    anime_list = data['data']
                    if len(anime_list) > 0:
                        self.log_result("AniLibria Updates", True, 
                                      f"Retrieved {len(anime_list)} updated anime", 
                                      {'count': len(anime_list)})
                        return True
                    else:
                        self.log_result("AniLibria Updates", False, "No updates data returned", data)
                        return False
                else:
                    self.log_result("AniLibria Updates", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("AniLibria Updates", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Updates", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_search(self) -> bool:
        """Test AniLibria search endpoint"""
        try:
            search_query = "аниме"
            response = self.session.get(f"{API_BASE_URL}/anilibria/search?search={search_query}&limit=3", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    # Search might return empty results, which is valid
                    anime_list = data.get('data', [])
                    self.log_result("AniLibria Search", True, 
                                  f"Search for '{search_query}' returned {len(anime_list)} results", 
                                  {'query': search_query, 'count': len(anime_list)})
                    return True
                else:
                    self.log_result("AniLibria Search", False, "Search failed", data)
                    return False
            else:
                self.log_result("AniLibria Search", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Search", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_search_fallback(self) -> bool:
        """Test AniLibria search fallback endpoint"""
        try:
            search_query = "test"
            response = self.session.get(f"{API_BASE_URL}/anilibria/search/fallback?query={search_query}&limit=3", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    anime_list = data.get('data', [])
                    source = data.get('source', 'unknown')
                    self.log_result("AniLibria Search Fallback", True, 
                                  f"Fallback search returned {len(anime_list)} results from {source}", 
                                  {'query': search_query, 'count': len(anime_list), 'source': source})
                    return True
                else:
                    self.log_result("AniLibria Search Fallback", False, "Fallback search failed", data)
                    return False
            else:
                self.log_result("AniLibria Search Fallback", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Search Fallback", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_by_id(self) -> bool:
        """Test getting anime by ID from AniLibria"""
        try:
            # First get a list to find a valid ID
            response = self.session.get(f"{API_BASE_URL}/anilibria/popular?limit=1", timeout=15)
            
            if response.status_code != 200:
                self.log_result("AniLibria By ID", False, "Could not get anime list for ID test")
                return False
            
            data = response.json()
            if not data.get('success') or not data.get('data') or len(data['data']) == 0:
                self.log_result("AniLibria By ID", False, "No anime available for ID test")
                return False
            
            anime_id = data['data'][0].get('id')
            if not anime_id:
                self.log_result("AniLibria By ID", False, "No valid anime ID found")
                return False
            
            # Now test getting by ID
            response = self.session.get(f"{API_BASE_URL}/anilibria/{anime_id}", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data'):
                    anime_data = data['data']
                    self.log_result("AniLibria By ID", True, 
                                  f"Retrieved anime by ID {anime_id}", 
                                  {'id': anime_id, 'title': anime_data.get('names', {}).get('ru', 'Unknown')})
                    return True
                else:
                    self.log_result("AniLibria By ID", False, f"Invalid response for ID {anime_id}", data)
                    return False
            else:
                self.log_result("AniLibria By ID", False, 
                              f"HTTP {response.status_code} for ID {anime_id}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria By ID", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_random(self) -> bool:
        """Test AniLibria random anime endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/anilibria/random?limit=2", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and data.get('data'):
                    anime_list = data['data']
                    self.log_result("AniLibria Random", True, 
                                  f"Retrieved {len(anime_list)} random anime", 
                                  {'count': len(anime_list)})
                    return True
                else:
                    self.log_result("AniLibria Random", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("AniLibria Random", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Random", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_genres(self) -> bool:
        """Test AniLibria genres endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/anilibria/genres", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    genres = data.get('data', [])
                    self.log_result("AniLibria Genres", True, 
                                  f"Retrieved {len(genres)} genres", 
                                  {'count': len(genres)})
                    return True
                else:
                    self.log_result("AniLibria Genres", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("AniLibria Genres", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Genres", False, f"Request failed: {str(e)}")
            return False
    
    def test_anilibria_schedule(self) -> bool:
        """Test AniLibria schedule endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/anilibria/schedule", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    schedule = data.get('data', [])
                    self.log_result("AniLibria Schedule", True, 
                                  f"Retrieved schedule data", 
                                  {'schedule_items': len(schedule) if isinstance(schedule, list) else 'object'})
                    return True
                else:
                    self.log_result("AniLibria Schedule", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("AniLibria Schedule", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("AniLibria Schedule", False, f"Request failed: {str(e)}")
            return False
    
    def test_direct_aniliberty_api(self) -> bool:
        """Test direct connection to AniLiberty API v1"""
        try:
            response = self.session.get(f"{ANILIBERTY_DIRECT_URL}/anime/releases/latest?limit=3", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    first_anime = data[0]
                    required_fields = ['id', 'name']
                    
                    missing_fields = [field for field in required_fields if field not in first_anime]
                    if missing_fields:
                        self.log_result("Direct AniLiberty API", False, 
                                      f"Missing required fields: {missing_fields}", first_anime)
                        return False
                    
                    self.log_result("Direct AniLiberty API", True, 
                                  f"Direct API returned {len(data)} releases", 
                                  {'count': len(data), 'first_anime_id': first_anime.get('id')})
                    return True
                else:
                    self.log_result("Direct AniLiberty API", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("Direct AniLiberty API", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Direct AniLiberty API", False, f"Request failed: {str(e)}")
            return False
    
    def test_aniliberty_search_direct(self) -> bool:
        """Test direct AniLiberty search API"""
        try:
            search_query = "аниме"
            response = self.session.get(f"{ANILIBERTY_DIRECT_URL}/app/search/releases?search={search_query}", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    self.log_result("Direct AniLiberty Search", True, 
                                  f"Direct search returned {len(data)} results", 
                                  {'query': search_query, 'count': len(data)})
                    return True
                else:
                    self.log_result("Direct AniLiberty Search", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("Direct AniLiberty Search", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Direct AniLiberty Search", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for AniLiberty v1 Integration")
        print("=" * 60)
        
        # Test backend health first
        if not self.test_backend_health():
            print("\n❌ Backend server is not running. Cannot proceed with API tests.")
            return self.get_summary()
        
        print("\n📡 Testing Backend AniLibria API Integration:")
        print("-" * 40)
        
        # Test all AniLibria endpoints through backend
        self.test_anilibria_popular()
        self.test_anilibria_updates()
        self.test_anilibria_search()
        self.test_anilibria_search_fallback()
        self.test_anilibria_by_id()
        self.test_anilibria_random()
        self.test_anilibria_genres()
        self.test_anilibria_schedule()
        
        print("\n🌐 Testing Direct AniLiberty API v1:")
        print("-" * 40)
        
        # Test direct AniLiberty API
        self.test_direct_aniliberty_api()
        self.test_aniliberty_search_direct()
        
        return self.get_summary()
    
    def get_summary(self) -> Dict[str, Any]:
        """Get test summary"""
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - passed_tests
        
        summary = {
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            'results': self.results
        }
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {summary['success_rate']:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        return summary

def main():
    """Main test execution"""
    tester = BackendTester()
    summary = tester.run_all_tests()
    
    # Exit with appropriate code
    if summary['failed'] > 0:
        print(f"\n❌ {summary['failed']} tests failed")
        sys.exit(1)
    else:
        print(f"\n✅ All {summary['passed']} tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()