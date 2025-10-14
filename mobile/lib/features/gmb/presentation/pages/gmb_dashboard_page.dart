import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class GmbDashboardPage extends ConsumerStatefulWidget {
  const GmbDashboardPage({super.key});

  @override
  ConsumerState<GmbDashboardPage> createState() => _GmbDashboardPageState();
}

class _GmbDashboardPageState extends ConsumerState<GmbDashboardPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Google My Business'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () {
              // TODO: Sync all locations
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Connected Accounts Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.business, color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        'Connected Accounts',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // TODO: List connected accounts
                  const Text('No accounts connected yet'),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _connectGoogleAccount,
                    icon: const Icon(Icons.add),
                    label: const Text('Connect Google Account'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Locations Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.green),
                      const SizedBox(width: 8),
                      Text(
                        'Business Locations',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // TODO: List locations
                  const Text('Connect an account to see your locations'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Quick Actions
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Quick Actions',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.edit, color: Colors.orange),
                    title: const Text('Bulk Update Profiles'),
                    subtitle: const Text('Update all locations at once'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      // Navigate to bulk update page
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.post_add, color: Colors.purple),
                    title: const Text('Create Post'),
                    subtitle: const Text('Post to all locations'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      // Navigate to create post page
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.star, color: Colors.amber),
                    title: const Text('View Reviews'),
                    subtitle: const Text('Manage customer reviews'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      // Navigate to reviews page
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.analytics, color: Colors.teal),
                    title: const Text('View Insights'),
                    subtitle: const Text('Performance analytics'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      // Navigate to insights page
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _connectGoogleAccount() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Connect Google Account'),
        content: const Text(
          'You will be redirected to Google to authorize access to your Business Profile accounts.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement Google OAuth flow
              _initiateGoogleOAuth();
            },
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }

  void _initiateGoogleOAuth() {
    // TODO: Implement Google OAuth flow
    // 1. Generate OAuth URL with proper scopes
    // 2. Open in browser/webview
    // 3. Handle callback with authorization code
    // 4. Call gmb_connect Edge Function
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Google OAuth integration will be implemented here'),
      ),
    );
  }
}
