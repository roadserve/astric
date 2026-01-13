import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/phone_verification_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/organization/presentation/pages/organization_selection_page.dart';
import '../../features/billing/presentation/pages/invoices_page.dart';
import '../../features/billing/presentation/pages/create_invoice_page.dart';
import '../../features/customers/presentation/pages/customers_page.dart';
import '../../features/products/presentation/pages/products_page.dart';
import '../../features/payroll/presentation/pages/employees_page.dart';
import '../../features/payroll/presentation/pages/attendance_page.dart';
import '../../features/whatsapp/presentation/pages/campaigns_page.dart';
import '../../features/ai/presentation/pages/ai_copilot_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/gmb/presentation/pages/gmb_dashboard_page.dart';
import '../../features/social/presentation/pages/social_media_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.value?.session != null;
      final isLoggingIn = state.matchedLocation.startsWith('/login') ||
                         state.matchedLocation.startsWith('/register') ||
                         state.matchedLocation.startsWith('/phone-verification');
      
      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }
      
      if (isLoggedIn && isLoggingIn) {
        return '/dashboard';
      }
      
      return null;
    },
    routes: [
      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/phone-verification',
        builder: (context, state) => const PhoneVerificationPage(),
      ),
      
      // Main app routes
      GoRoute(
        path: '/organization-selection',
        builder: (context, state) => const OrganizationSelectionPage(),
      ),
      
      // Dashboard with nested routes
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPage(),
        routes: [
          // Billing routes
          GoRoute(
            path: 'invoices',
            builder: (context, state) => const InvoicesPage(),
          ),
          GoRoute(
            path: 'invoices/create',
            builder: (context, state) => const CreateInvoicePage(),
          ),
          GoRoute(
            path: 'invoices/:id',
            builder: (context, state) {
              final invoiceId = state.pathParameters['id']!;
              // TODO: Create InvoiceDetailPage for viewing/editing
              return const CreateInvoicePage();
            },
          ),
          
          // Customer routes
          GoRoute(
            path: 'customers',
            builder: (context, state) => const CustomersPage(),
          ),
          
          // Product routes
          GoRoute(
            path: 'products',
            builder: (context, state) => const ProductsPage(),
          ),
          
          // Payroll routes
          GoRoute(
            path: 'employees',
            builder: (context, state) => const EmployeesPage(),
          ),
          GoRoute(
            path: 'attendance',
            builder: (context, state) => const AttendancePage(),
          ),
          
          // WhatsApp routes
          GoRoute(
            path: 'campaigns',
            builder: (context, state) => const CampaignsPage(),
          ),
          
          // AI routes
          GoRoute(
            path: 'ai-copilot',
            builder: (context, state) => const AiCopilotPage(),
          ),
          
          // GMB routes
          GoRoute(
            path: 'gmb',
            builder: (context, state) => const GmbDashboardPage(),
          ),
          
          // Social Media routes
          GoRoute(
            path: 'social',
            builder: (context, state) => const SocialMediaPage(),
          ),
          
          // Settings routes
          GoRoute(
            path: 'settings',
            builder: (context, state) => const SettingsPage(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'The page you are looking for does not exist.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Go to Dashboard'),
            ),
          ],
        ),
      ),
    ),
  );
});
