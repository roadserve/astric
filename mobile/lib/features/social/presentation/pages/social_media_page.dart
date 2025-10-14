import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/supabase_config.dart';

class SocialMediaPage extends ConsumerStatefulWidget {
  const SocialMediaPage({super.key});

  @override
  ConsumerState<SocialMediaPage> createState() => _SocialMediaPageState();
}

class _SocialMediaPageState extends ConsumerState<SocialMediaPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _accounts = [];
  List<Map<String, dynamic>> _posts = [];
  List<Map<String, dynamic>> _ads = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Load accounts
      final accountsResponse = await SupabaseConfig.client
          .from('social_media_accounts')
          .select('*')
          .eq('is_active', true);

      // Load posts
      final postsResponse = await SupabaseConfig.client
          .from('social_media_posts')
          .select('*')
          .order('created_at', ascending: false)
          .limit(20);

      // Load ads
      final adsResponse = await SupabaseConfig.client
          .from('social_media_ads')
          .select('*')
          .order('created_at', ascending: false)
          .limit(20);

      setState(() {
        _accounts = List<Map<String, dynamic>>.from(accountsResponse);
        _posts = List<Map<String, dynamic>>.from(postsResponse);
        _ads = List<Map<String, dynamic>>.from(adsResponse);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Media Manager'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Accounts', icon: Icon(Icons.account_circle)),
            Tab(text: 'Posts', icon: Icon(Icons.post_add)),
            Tab(text: 'Ads', icon: Icon(Icons.campaign)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAccountsTab(),
          _buildPostsTab(),
          _buildAdsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'social_media_fab',
        onPressed: () {
          if (_tabController.index == 0) {
            _showConnectAccountDialog();
          } else if (_tabController.index == 1) {
            _showCreatePostDialog();
          } else {
            _showCreateAdDialog();
          }
        },
        icon: const Icon(Icons.add),
        label: Text(_tabController.index == 0
            ? 'Connect'
            : _tabController.index == 1
                ? 'Create Post'
                : 'Create Ad'),
      ),
    );
  }

  Widget _buildAccountsTab() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_accounts.isEmpty) {
      return _buildEmptyState(
        Icons.account_circle,
        'No accounts connected',
        'Connect your social media accounts to get started',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _accounts.length,
        itemBuilder: (context, index) {
          final account = _accounts[index];
          return _buildAccountCard(account);
        },
      ),
    );
  }

  Widget _buildAccountCard(Map<String, dynamic> account) {
    final platform = account['platform'] as String;
    final name = account['account_name'] as String;
    final followers = account['followers_count'] as int? ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getPlatformColor(platform),
          child: Icon(_getPlatformIcon(platform), color: Colors.white),
        ),
        title: Text(
          name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${platform.toUpperCase()} • ${followers.toString()} followers',
        ),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'analytics',
              child: Row(
                children: [
                  Icon(Icons.analytics, size: 20),
                  SizedBox(width: 8),
                  Text('View Analytics'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'disconnect',
              child: Row(
                children: [
                  Icon(Icons.link_off, size: 20, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Disconnect', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
          onSelected: (value) {
            if (value == 'analytics') {
              _showAnalytics(account);
            } else if (value == 'disconnect') {
              _disconnectAccount(account['id']);
            }
          },
        ),
      ),
    );
  }

  Widget _buildPostsTab() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_posts.isEmpty) {
      return _buildEmptyState(
        Icons.post_add,
        'No posts yet',
        'Create your first social media post',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _posts.length,
        itemBuilder: (context, index) {
          final post = _posts[index];
          return _buildPostCard(post);
        },
      ),
    );
  }

  Widget _buildPostCard(Map<String, dynamic> post) {
    final platform = post['platform'] as String;
    final content = post['content'] as String;
    final status = post['status'] as String;
    final engagement = post['engagement'] as Map<String, dynamic>?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_getPlatformIcon(platform),
                    color: _getPlatformColor(platform), size: 20),
                const SizedBox(width: 8),
                Text(
                  platform.toUpperCase(),
                  style: TextStyle(
                    color: _getPlatformColor(platform),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              content,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            if (engagement != null && status == 'published') ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildEngagementStat(
                      Icons.favorite, engagement['likes'] ?? 0),
                  const SizedBox(width: 16),
                  _buildEngagementStat(
                      Icons.comment, engagement['comments'] ?? 0),
                  const SizedBox(width: 16),
                  _buildEngagementStat(
                      Icons.share, engagement['shares'] ?? 0),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEngagementStat(IconData icon, int count) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          count.toString(),
          style: TextStyle(color: Colors.grey[600], fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildAdsTab() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_ads.isEmpty) {
      return _buildEmptyState(
        Icons.campaign,
        'No ads yet',
        'Create your first social media ad campaign',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _ads.length,
        itemBuilder: (context, index) {
          final ad = _ads[index];
          return _buildAdCard(ad);
        },
      ),
    );
  }

  Widget _buildAdCard(Map<String, dynamic> ad) {
    final platform = ad['platform'] as String;
    final name = ad['campaign_name'] as String;
    final status = ad['status'] as String;
    final budget = (ad['budget'] as num?)?.toDouble() ?? 0.0;
    final metrics = ad['metrics'] as Map<String, dynamic>?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_getPlatformIcon(platform),
                    color: _getPlatformColor(platform)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Budget',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                    Text(
                      '₹${budget.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
                if (metrics != null)
                  Column(
                    children: [
                      Text(
                        'Impressions',
                        style:
                            TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                      Text(
                        (metrics['impressions'] ?? 0).toString(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                if (metrics != null)
                  Column(
                    children: [
                      Text(
                        'Clicks',
                        style:
                            TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                      Text(
                        (metrics['clicks'] ?? 0).toString(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
              ],
            ),
            if (status == 'active') ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pauseAd(ad['id']),
                      icon: const Icon(Icons.pause, size: 18),
                      label: const Text('Pause'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _viewInsights(ad['id']),
                      icon: const Icon(Icons.insights, size: 18),
                      label: const Text('Insights'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _showConnectAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Connect Social Media'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildPlatformButton('Facebook', Icons.facebook, Colors.blue[800]!),
              _buildPlatformButton('Instagram', Icons.camera_alt, Colors.purple),
              _buildPlatformButton('TikTok', Icons.music_note, Colors.black),
              _buildPlatformButton('Twitter/X', Icons.tag, Colors.blue),
              _buildPlatformButton('LinkedIn', Icons.work, Colors.blue[700]!),
              _buildPlatformButton('YouTube', Icons.play_circle, Colors.red),
              _buildPlatformButton('Snapchat', Icons.camera, Colors.yellow[700]!),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Widget _buildPlatformButton(String name, IconData icon, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: color),
        title: Text(name),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          Navigator.pop(context);
          _connectPlatform(name.toLowerCase().split('/')[0]);
        },
      ),
    );
  }

  Future<void> _connectPlatform(String platform) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Connect $platform'),
        content: Text(
            'This will redirect you to $platform to authorize access. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Implement OAuth flow
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                    content: Text('$platform connection will open OAuth flow')),
              );
            },
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }

  void _showCreatePostDialog() {
    final contentController = TextEditingController();
    List<String> selectedPlatforms = [];

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Create Post'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: contentController,
                  decoration: const InputDecoration(
                    labelText: 'Post Content',
                    border: OutlineInputBorder(),
                    hintText: 'What do you want to share?',
                  ),
                  maxLines: 5,
                ),
                const SizedBox(height: 16),
                const Text('Select Platforms:',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _accounts.map((account) {
                    final platform = account['platform'] as String;
                    final isSelected = selectedPlatforms.contains(platform);
                    return FilterChip(
                      label: Text(platform.toUpperCase()),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            selectedPlatforms.add(platform);
                          } else {
                            selectedPlatforms.remove(platform);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (contentController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Content is required')),
                  );
                  return;
                }

                Navigator.pop(context);
                await _createPost(
                    contentController.text, selectedPlatforms);
              },
              child: const Text('Post Now'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createPost(String content, List<String> platforms) async {
    try {
      for (final platform in platforms) {
        await SupabaseConfig.client.from('social_media_posts').insert({
          'platform': platform,
          'content': content,
          'status': 'published',
          'published_time': DateTime.now().toIso8601String(),
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Post published successfully!')),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error creating post: $e')),
        );
      }
    }
  }

  void _showCreateAdDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Ad Campaign'),
        content: const Text(
            'Ad creation feature - Set up campaigns with targeting, budget, and creative assets.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _showAnalytics(Map<String, dynamic> account) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final response = await SupabaseConfig.client.functions.invoke(
        'social_analytics',
        body: {
          'account_id': account['id'],
          'date_range': '30d',
        },
      );

      if (mounted) {
        Navigator.pop(context);

        final analytics = response.data['analytics'];
        final insights = response.data['insights'];

        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('${account['account_name']} Analytics'),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildAnalyticRow('Followers', analytics['followers_count']),
                  _buildAnalyticRow('Engagement Rate',
                      '${analytics['engagement_rate']}%'),
                  _buildAnalyticRow('Reach', analytics['reach']),
                  _buildAnalyticRow('Impressions', analytics['impressions']),
                  const Divider(height: 24),
                  const Text('Recommendations:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...((insights['recommendations'] as List?)?.map((rec) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.lightbulb,
                                  size: 16, color: Colors.orange),
                              const SizedBox(width: 8),
                              Expanded(child: Text(rec.toString())),
                            ],
                          ),
                        );
                      }).toList() ??
                      []),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading analytics: $e')),
        );
      }
    }
  }

  Widget _buildAnalyticRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value.toString(),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Future<void> _disconnectAccount(String accountId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disconnect Account'),
        content: const Text('Are you sure you want to disconnect this account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await SupabaseConfig.client
            .from('social_media_accounts')
            .delete()
            .eq('id', accountId);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account disconnected')),
          );
          _loadData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _pauseAd(String adId) async {
    try {
      await SupabaseConfig.client.functions.invoke(
        'social_ads',
        body: {'ad_id': adId, 'action': 'pause'},
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ad paused successfully')),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _viewInsights(String adId) async {
    try {
      final response = await SupabaseConfig.client.functions.invoke(
        'social_ads',
        body: {'ad_id': adId, 'action': 'get_insights'},
      );

      if (mounted) {
        final metrics = response.data['result']['metrics'];
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Ad Insights'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildAnalyticRow('Impressions', metrics['impressions']),
                _buildAnalyticRow('Clicks', metrics['clicks']),
                _buildAnalyticRow('CTR', '${metrics['ctr']}%'),
                _buildAnalyticRow('CPC', '₹${metrics['cpc']}'),
                _buildAnalyticRow('ROAS', metrics['roas']),
                _buildAnalyticRow('Spend', '₹${metrics['spend']}'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  IconData _getPlatformIcon(String platform) {
    switch (platform) {
      case 'facebook':
        return Icons.facebook;
      case 'instagram':
        return Icons.camera_alt;
      case 'tiktok':
        return Icons.music_note;
      case 'twitter':
        return Icons.tag;
      case 'linkedin':
        return Icons.work;
      case 'youtube':
        return Icons.play_circle;
      case 'snapchat':
        return Icons.camera;
      default:
        return Icons.public;
    }
  }

  Color _getPlatformColor(String platform) {
    switch (platform) {
      case 'facebook':
        return Colors.blue[800]!;
      case 'instagram':
        return Colors.purple;
      case 'tiktok':
        return Colors.black;
      case 'twitter':
        return Colors.blue;
      case 'linkedin':
        return Colors.blue[700]!;
      case 'youtube':
        return Colors.red;
      case 'snapchat':
        return Colors.yellow[700]!;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'published':
      case 'active':
        return Colors.green;
      case 'scheduled':
        return Colors.blue;
      case 'draft':
        return Colors.orange;
      case 'paused':
        return Colors.grey;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
