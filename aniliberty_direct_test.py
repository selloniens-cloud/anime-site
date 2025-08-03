#!/usr/bin/env python3
"""
Direct AniLiberty API v1 Testing
Tests the specific endpoints mentioned in the review request
"""

import requests
import json
import time
import sys
from typing import Dict, List, Any, Optional

# AniLiberty API v1 endpoints from review request
ANILIBERTY_BASE_URL = "https://aniliberty.top/api/v1"

class AniLibertyTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AniLibertyTester/1.0'
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
    
    def test_latest_releases(self) -> bool:
        """Test GET /anime/releases/latest?limit=10"""
        try:
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/latest?limit=10", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    first_release = data[0]
                    required_fields = ['id', 'name']
                    
                    missing_fields = [field for field in required_fields if field not in first_release]
                    if missing_fields:
                        self.log_result("Latest Releases", False, 
                                      f"Missing required fields: {missing_fields}", first_release)
                        return False
                    
                    # Check name structure
                    name = first_release.get('name', {})
                    if not isinstance(name, dict) or not name.get('main'):
                        self.log_result("Latest Releases", False, 
                                      "Invalid name structure - missing 'main' field", first_release)
                        return False
                    
                    self.log_result("Latest Releases", True, 
                                  f"Retrieved {len(data)} latest releases", 
                                  {
                                      'count': len(data), 
                                      'first_release': {
                                          'id': first_release.get('id'),
                                          'name': name.get('main'),
                                          'poster': first_release.get('poster') is not None,
                                          'description': first_release.get('description') is not None,
                                          'episodes_total': first_release.get('episodes_total')
                                      }
                                  })
                    return True
                else:
                    self.log_result("Latest Releases", False, "No releases returned or invalid structure", data)
                    return False
            else:
                self.log_result("Latest Releases", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Latest Releases", False, f"Request failed: {str(e)}")
            return False
    
    def test_release_by_id(self) -> bool:
        """Test GET /anime/releases/{id}"""
        try:
            # First get a release ID
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/latest?limit=1", timeout=15)
            
            if response.status_code != 200:
                self.log_result("Release By ID", False, "Could not get release list for ID test")
                return False
            
            data = response.json()
            if not isinstance(data, list) or len(data) == 0:
                self.log_result("Release By ID", False, "No releases available for ID test")
                return False
            
            release_id = data[0].get('id')
            if not release_id:
                self.log_result("Release By ID", False, "No valid release ID found")
                return False
            
            # Now test getting by ID
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/{release_id}", timeout=15)
            
            if response.status_code == 200:
                release_data = response.json()
                
                if release_data.get('id') == release_id:
                    self.log_result("Release By ID", True, 
                                  f"Retrieved release by ID {release_id}", 
                                  {
                                      'id': release_id, 
                                      'name': release_data.get('name', {}).get('main', 'Unknown'),
                                      'has_poster': release_data.get('poster') is not None,
                                      'has_description': release_data.get('description') is not None
                                  })
                    return True
                else:
                    self.log_result("Release By ID", False, f"Invalid response for ID {release_id}", release_data)
                    return False
            else:
                self.log_result("Release By ID", False, 
                              f"HTTP {response.status_code} for ID {release_id}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Release By ID", False, f"Request failed: {str(e)}")
            return False
    
    def test_release_with_episodes(self) -> bool:
        """Test GET /anime/releases/{id}?include=episodes"""
        try:
            # First get a release ID
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/latest?limit=1", timeout=15)
            
            if response.status_code != 200:
                self.log_result("Release With Episodes", False, "Could not get release list for episodes test")
                return False
            
            data = response.json()
            if not isinstance(data, list) or len(data) == 0:
                self.log_result("Release With Episodes", False, "No releases available for episodes test")
                return False
            
            release_id = data[0].get('id')
            if not release_id:
                self.log_result("Release With Episodes", False, "No valid release ID found")
                return False
            
            # Now test getting with episodes
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/{release_id}?include=episodes", timeout=15)
            
            if response.status_code == 200:
                release_data = response.json()
                
                if release_data.get('id') == release_id:
                    episodes = release_data.get('episodes', [])
                    self.log_result("Release With Episodes", True, 
                                  f"Retrieved release {release_id} with {len(episodes)} episodes", 
                                  {
                                      'id': release_id, 
                                      'name': release_data.get('name', {}).get('main', 'Unknown'),
                                      'episodes_count': len(episodes),
                                      'has_episodes': len(episodes) > 0
                                  })
                    return True
                else:
                    self.log_result("Release With Episodes", False, f"Invalid response for ID {release_id}", release_data)
                    return False
            else:
                self.log_result("Release With Episodes", False, 
                              f"HTTP {response.status_code} for ID {release_id}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Release With Episodes", False, f"Request failed: {str(e)}")
            return False
    
    def test_episode_by_id(self) -> bool:
        """Test GET /anime/releases/episodes/{episodeId}"""
        try:
            # First get a release with episodes
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/latest?limit=5", timeout=15)
            
            if response.status_code != 200:
                self.log_result("Episode By ID", False, "Could not get release list for episode test")
                return False
            
            data = response.json()
            if not isinstance(data, list) or len(data) == 0:
                self.log_result("Episode By ID", False, "No releases available for episode test")
                return False
            
            episode_id = None
            release_name = None
            
            # Look for a release with episodes
            for release in data:
                release_id = release.get('id')
                if release_id:
                    # Try to get episodes for this release
                    ep_response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/{release_id}?include=episodes", timeout=15)
                    if ep_response.status_code == 200:
                        ep_data = ep_response.json()
                        episodes = ep_data.get('episodes', [])
                        if episodes and len(episodes) > 0:
                            episode_id = episodes[0].get('id')
                            release_name = release.get('name', {}).get('main', 'Unknown')
                            break
            
            if not episode_id:
                self.log_result("Episode By ID", False, "No valid episode ID found in any release")
                return False
            
            # Now test getting episode by ID
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/anime/releases/episodes/{episode_id}", timeout=15)
            
            if response.status_code == 200:
                episode_data = response.json()
                
                if episode_data.get('id') == episode_id:
                    self.log_result("Episode By ID", True, 
                                  f"Retrieved episode {episode_id} from {release_name}", 
                                  {
                                      'episode_id': episode_id,
                                      'release_name': release_name,
                                      'episode_name': episode_data.get('name'),
                                      'ordinal': episode_data.get('ordinal'),
                                      'duration': episode_data.get('duration'),
                                      'has_hls_480': episode_data.get('hls_480') is not None,
                                      'has_hls_720': episode_data.get('hls_720') is not None,
                                      'has_hls_1080': episode_data.get('hls_1080') is not None
                                  })
                    return True
                else:
                    self.log_result("Episode By ID", False, f"Invalid response for episode ID {episode_id}", episode_data)
                    return False
            else:
                self.log_result("Episode By ID", False, 
                              f"HTTP {response.status_code} for episode ID {episode_id}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Episode By ID", False, f"Request failed: {str(e)}")
            return False
    
    def test_search_releases(self) -> bool:
        """Test GET /app/search/releases?search=query"""
        try:
            search_query = "аниме"
            response = self.session.get(f"{ANILIBERTY_BASE_URL}/app/search/releases?search={search_query}", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    self.log_result("Search Releases", True, 
                                  f"Search for '{search_query}' returned {len(data)} results", 
                                  {
                                      'query': search_query, 
                                      'count': len(data),
                                      'first_result': data[0].get('name', {}).get('main') if len(data) > 0 else None
                                  })
                    return True
                else:
                    self.log_result("Search Releases", False, "Invalid response structure", data)
                    return False
            elif response.status_code == 422:
                # Try with a different query parameter format
                response = self.session.get(f"{ANILIBERTY_BASE_URL}/app/search/releases?query={search_query}", timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_result("Search Releases", True, 
                                      f"Search for '{search_query}' (with query param) returned {len(data)} results", 
                                      {'query': search_query, 'count': len(data)})
                        return True
                
                self.log_result("Search Releases", False, 
                              f"HTTP 422 - Invalid search parameters", response.text[:200])
                return False
            else:
                self.log_result("Search Releases", False, 
                              f"HTTP {response.status_code}", response.text[:200])
                return False
                
        except Exception as e:
            self.log_result("Search Releases", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all AniLiberty API v1 tests"""
        print("🚀 Testing AniLiberty API v1 Endpoints")
        print("=" * 50)
        print(f"Base URL: {ANILIBERTY_BASE_URL}")
        print()
        
        # Test all endpoints mentioned in review request
        self.test_latest_releases()
        self.test_release_by_id()
        self.test_release_with_episodes()
        self.test_episode_by_id()
        self.test_search_releases()
        
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
        
        print("\n" + "=" * 50)
        print("📊 ANILIBERTY API v1 TEST SUMMARY")
        print("=" * 50)
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
    tester = AniLibertyTester()
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