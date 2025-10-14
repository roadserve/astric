import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          // Profile section
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            subtitle: const Text('Manage your profile information'),
            onTap: () {
              // TODO: Navigate to profile
            },
          ),
          const Divider(),
          
          // Organization section
          ListTile(
            leading: const Icon(Icons.business),
            title: const Text('Organization'),
            subtitle: const Text('Manage organization settings'),
            onTap: () {
              // TODO: Navigate to organization settings
            },
          ),
          const Divider(),
          
          // Notifications section
          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Notifications'),
            subtitle: const Text('Manage notification preferences'),
            onTap: () {
              // TODO: Navigate to notifications settings
            },
          ),
          const Divider(),
          
          // Billing section
          ListTile(
            leading: const Icon(Icons.payment),
            title: const Text('Billing & Subscription'),
            subtitle: const Text('Manage your subscription'),
            onTap: () {
              // TODO: Navigate to billing
            },
          ),
          const Divider(),
          
          // Help section
          ListTile(
            leading: const Icon(Icons.help),
            title: const Text('Help & Support'),
            subtitle: const Text('Get help and contact support'),
            onTap: () {
              // TODO: Navigate to help
            },
          ),
          const Divider(),
          
          // About section
          ListTile(
            leading: const Icon(Icons.info),
            title: const Text('About'),
            subtitle: const Text('App version and information'),
            onTap: () {
              // TODO: Show about dialog
            },
          ),
          const Divider(),
          
          // Logout section
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () {
              _showLogoutDialog(context);
            },
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(authNotifierProvider.notifier).signOut();
              context.go('/login');
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
