import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/models/invoice_model.dart';
import '../../../../core/config/supabase_config.dart';

class InvoiceRepository {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Invoice>> getInvoices(String organizationId, {String? status}) async {
    var query = _client
        .from('invoices')
        .select('*, customer:customers(*), items:invoice_items(*)')
        .eq('organization_id', organizationId)
        .order('created_at', ascending: false);

    if (status != null) {
      query = query.eq('status', status);
    }

    final response = await query;
    return (response as List).map((json) => Invoice.fromJson(json)).toList();
  }

  Future<Invoice> getInvoiceById(String invoiceId) async {
    final response = await _client
        .from('invoices')
        .select('*, customer:customers(*), items:invoice_items(*)')
        .eq('id', invoiceId)
        .single();

    return Invoice.fromJson(response);
  }

  Future<Invoice> createInvoice({
    required String organizationId,
    required String customerId,
    required String invoiceNumber,
    required DateTime invoiceDate,
    DateTime? dueDate,
    required List<InvoiceItem> items,
    String? notes,
    String? terms,
  }) async {
    // Calculate totals
    double subtotal = 0;
    double taxAmount = 0;
    
    for (var item in items) {
      subtotal += item.lineTotal;
      taxAmount += (item.lineTotal * item.taxRate / 100);
    }

    final totalAmount = subtotal + taxAmount;

    // Create invoice
    final invoiceResponse = await _client.from('invoices').insert({
      'organization_id': organizationId,
      'customer_id': customerId,
      'invoice_number': invoiceNumber,
      'invoice_date': invoiceDate.toIso8601String(),
      'due_date': dueDate?.toIso8601String(),
      'status': 'draft',
      'subtotal': subtotal,
      'tax_amount': taxAmount,
      'discount_amount': 0,
      'total_amount': totalAmount,
      'notes': notes,
      'terms': terms,
      'created_by': _client.auth.currentUser!.id,
    }).select().single();

    final invoiceId = invoiceResponse['id'];

    // Create invoice items
    final itemsData = items.map((item) => {
      'invoice_id': invoiceId,
      'product_id': item.productId,
      'description': item.description,
      'quantity': item.quantity,
      'unit_price': item.unitPrice,
      'tax_rate': item.taxRate,
      'discount_percent': item.discountPercent,
      'line_total': item.lineTotal,
    }).toList();

    await _client.from('invoice_items').insert(itemsData);

    return getInvoiceById(invoiceId);
  }

  Future<Invoice> updateInvoice(String invoiceId, Map<String, dynamic> updates) async {
    await _client.from('invoices').update(updates).eq('id', invoiceId);
    return getInvoiceById(invoiceId);
  }

  Future<void> deleteInvoice(String invoiceId) async {
    await _client.from('invoices').delete().eq('id', invoiceId);
  }

  Future<List<Payment>> getPayments(String invoiceId) async {
    final response = await _client
        .from('payments')
        .select()
        .eq('invoice_id', invoiceId)
        .order('payment_date', ascending: false);

    return (response as List).map((json) => Payment.fromJson(json)).toList();
  }

  Future<Payment> addPayment({
    required String invoiceId,
    required double amount,
    required String paymentMethod,
    required DateTime paymentDate,
    String? referenceNumber,
    String? notes,
  }) async {
    final response = await _client.from('payments').insert({
      'invoice_id': invoiceId,
      'amount': amount,
      'payment_method': paymentMethod,
      'payment_date': paymentDate.toIso8601String(),
      'reference_number': referenceNumber,
      'notes': notes,
      'created_by': _client.auth.currentUser!.id,
    }).select().single();

    // Check if invoice is fully paid
    final payments = await getPayments(invoiceId);
    final totalPaid = payments.fold<double>(0, (sum, payment) => sum + payment.amount);
    
    final invoice = await getInvoiceById(invoiceId);
    if (totalPaid >= invoice.totalAmount) {
      await updateInvoice(invoiceId, {'status': 'paid'});
    }

    return Payment.fromJson(response);
  }

  Future<String> generatePdf(String invoiceId) async {
    final response = await _client.functions.invoke(
      'create_invoice_pdf',
      body: {
        'invoice_id': invoiceId,
        'organization_id': _client.auth.currentUser!.userMetadata?['organization_id'],
      },
    );

    return response.data['pdf_url'];
  }
}
