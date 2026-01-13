import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/supabase_config.dart';

final authStateProvider = StreamProvider<AuthState>((ref) {
  return SupabaseConfig.client.auth.onAuthStateChange;
});

final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.when(
    data: (data) => data.session?.user,
    loading: () => null,
    error: (_, __) => null,
  );
});

final isLoggedInProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user != null;
});

class AuthNotifier extends StateNotifier<AsyncValue<void>> {
  AuthNotifier() : super(const AsyncValue.data(null));

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final response = await SupabaseConfig.signInWithEmail(
        email: email,
        password: password,
      );
      
      if (response.user != null) {
        state = const AsyncValue.data(null);
      } else {
        state = AsyncValue.error('Sign in failed', StackTrace.current);
      }
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> signUpWithEmail({
    required String email,
    required String password,
    required String fullName,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final response = await SupabaseConfig.signUpWithEmail(
        email: email,
        password: password,
        data: {'full_name': fullName},
      );
      
      if (response.user != null) {
        state = const AsyncValue.data(null);
      } else {
        state = AsyncValue.error('Sign up failed', StackTrace.current);
      }
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> signInWithPhone(String phone) async {
    state = const AsyncValue.loading();
    
    try {
      final response = await SupabaseConfig.signInWithPhone(phone: phone);
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> verifyOtp({
    required String phone,
    required String token,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final response = await SupabaseConfig.verifyOtp(
        phone: phone,
        token: token,
      );
      
      if (response.user != null) {
        state = const AsyncValue.data(null);
      } else {
        state = AsyncValue.error('OTP verification failed', StackTrace.current);
      }
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    
    try {
      await SupabaseConfig.signOut();
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AsyncValue<void>>((ref) {
  return AuthNotifier();
});
