import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/auth_provider.dart';

class PhoneVerificationPage extends ConsumerStatefulWidget {
  const PhoneVerificationPage({super.key});

  @override
  ConsumerState<PhoneVerificationPage> createState() => _PhoneVerificationPageState();
}

class _PhoneVerificationPageState extends ConsumerState<PhoneVerificationPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _isOtpSent = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    
    ref.listen(authStateProvider, (previous, next) {
      next.whenData((authState) {
        if (authState.session != null) {
          context.go('/dashboard');
        }
      });
    });

    return Scaffold(
      appBar: AppBar(
        title: Text(_isOtpSent ? 'Verify OTP' : 'Phone Verification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_isOtpSent) {
              setState(() {
                _isOtpSent = false;
                _otpController.clear();
              });
            } else {
              context.go('/login');
            }
          },
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icon
                Icon(
                  _isOtpSent ? Icons.sms : Icons.phone,
                  size: 80,
                  color: Colors.blue,
                ),
                const SizedBox(height: 24),
                
                // Title
                Text(
                  _isOtpSent ? 'Enter Verification Code' : 'Enter Phone Number',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                
                // Subtitle
                Text(
                  _isOtpSent
                      ? 'We sent a 6-digit code to ${_phoneController.text}'
                      : 'We\'ll send you a verification code',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                
                if (!_isOtpSent) ...[
                  // Phone number field
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      prefixIcon: Icon(Icons.phone_outlined),
                      hintText: '+91 9876543210',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your phone number';
                      }
                      if (value.length < 10) {
                        return 'Please enter a valid phone number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Send OTP button
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleSendOtp,
                    child: authState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Send OTP'),
                  ),
                ] else ...[
                  // OTP field
                  TextFormField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 24,
                      letterSpacing: 8,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Verification Code',
                      hintText: '123456',
                      counterText: '',
                    ),
                    maxLength: 6,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter the verification code';
                      }
                      if (value.length != 6) {
                        return 'Please enter a 6-digit code';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Verify OTP button
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleVerifyOtp,
                    child: authState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Verify OTP'),
                  ),
                  const SizedBox(height: 16),
                  
                  // Resend OTP button
                  TextButton(
                    onPressed: authState.isLoading ? null : _handleResendOtp,
                    child: const Text('Resend OTP'),
                  ),
                ],
                
                const SizedBox(height: 32),
                
                // Back to login
                TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Back to Sign In'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleSendOtp() {
    if (_formKey.currentState!.validate()) {
      ref.read(authNotifierProvider.notifier).signInWithPhone(
        _phoneController.text.trim(),
      ).then((_) {
        setState(() {
          _isOtpSent = true;
        });
      });
    }
  }

  void _handleVerifyOtp() {
    if (_formKey.currentState!.validate()) {
      ref.read(authNotifierProvider.notifier).verifyOtp(
        phone: _phoneController.text.trim(),
        token: _otpController.text.trim(),
      );
    }
  }

  void _handleResendOtp() {
    ref.read(authNotifierProvider.notifier).signInWithPhone(
      _phoneController.text.trim(),
    );
  }
}
