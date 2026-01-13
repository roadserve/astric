import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/invoice_model.dart';
import '../../data/repositories/invoice_repository.dart';

final invoiceRepositoryProvider = Provider<InvoiceRepository>((ref) {
  return InvoiceRepository();
});

final invoicesProvider = FutureProvider.family<List<Invoice>, String>((ref, organizationId) async {
  final repository = ref.watch(invoiceRepositoryProvider);
  return repository.getInvoices(organizationId);
});

final invoiceByIdProvider = FutureProvider.family<Invoice, String>((ref, invoiceId) async {
  final repository = ref.watch(invoiceRepositoryProvider);
  return repository.getInvoiceById(invoiceId);
});

final invoicesByStatusProvider = FutureProvider.family<List<Invoice>, ({String organizationId, String status})>((ref, params) async {
  final repository = ref.watch(invoiceRepositoryProvider);
  return repository.getInvoices(params.organizationId, status: params.status);
});

class InvoiceNotifier extends StateNotifier<AsyncValue<void>> {
  final InvoiceRepository _repository;

  InvoiceNotifier(this._repository) : super(const AsyncValue.data(null));

  Future<Invoice?> createInvoice({
    required String organizationId,
    required String customerId,
    required String invoiceNumber,
    required DateTime invoiceDate,
    DateTime? dueDate,
    required List<InvoiceItem> items,
    String? notes,
    String? terms,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final invoice = await _repository.createInvoice(
        organizationId: organizationId,
        customerId: customerId,
        invoiceNumber: invoiceNumber,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        items: items,
        notes: notes,
        terms: terms,
      );
      
      state = const AsyncValue.data(null);
      return invoice;
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      return null;
    }
  }

  Future<void> updateInvoice(String invoiceId, Map<String, dynamic> updates) async {
    state = const AsyncValue.loading();
    
    try {
      await _repository.updateInvoice(invoiceId, updates);
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> deleteInvoice(String invoiceId) async {
    state = const AsyncValue.loading();
    
    try {
      await _repository.deleteInvoice(invoiceId);
      state = const AsyncValue.data(null);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<Payment?> addPayment({
    required String invoiceId,
    required double amount,
    required String paymentMethod,
    required DateTime paymentDate,
    String? referenceNumber,
    String? notes,
  }) async {
    state = const AsyncValue.loading();
    
    try {
      final payment = await _repository.addPayment(
        invoiceId: invoiceId,
        amount: amount,
        paymentMethod: paymentMethod,
        paymentDate: paymentDate,
        referenceNumber: referenceNumber,
        notes: notes,
      );
      
      state = const AsyncValue.data(null);
      return payment;
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      return null;
    }
  }

  Future<String?> generatePdf(String invoiceId) async {
    state = const AsyncValue.loading();
    
    try {
      final pdfUrl = await _repository.generatePdf(invoiceId);
      state = const AsyncValue.data(null);
      return pdfUrl;
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
      return null;
    }
  }
}

final invoiceNotifierProvider = StateNotifierProvider<InvoiceNotifier, AsyncValue<void>>((ref) {
  final repository = ref.watch(invoiceRepositoryProvider);
  return InvoiceNotifier(repository);
});
