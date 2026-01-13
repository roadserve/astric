import 'package:json_annotation/json_annotation.dart';

part 'invoice_model.g.dart';

@JsonSerializable()
class Invoice {
  final String id;
  @JsonKey(name: 'organization_id')
  final String organizationId;
  @JsonKey(name: 'customer_id')
  final String? customerId;
  @JsonKey(name: 'invoice_number')
  final String invoiceNumber;
  @JsonKey(name: 'invoice_date')
  final DateTime invoiceDate;
  @JsonKey(name: 'due_date')
  final DateTime? dueDate;
  final String status;
  final double subtotal;
  @JsonKey(name: 'tax_amount')
  final double taxAmount;
  @JsonKey(name: 'discount_amount')
  final double discountAmount;
  @JsonKey(name: 'total_amount')
  final double totalAmount;
  final String? notes;
  final String? terms;
  @JsonKey(name: 'created_by')
  final String createdBy;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  
  // Relationships
  final Customer? customer;
  final List<InvoiceItem>? items;

  Invoice({
    required this.id,
    required this.organizationId,
    this.customerId,
    required this.invoiceNumber,
    required this.invoiceDate,
    this.dueDate,
    required this.status,
    required this.subtotal,
    required this.taxAmount,
    required this.discountAmount,
    required this.totalAmount,
    this.notes,
    this.terms,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.customer,
    this.items,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) => _$InvoiceFromJson(json);
  Map<String, dynamic> toJson() => _$InvoiceToJson(this);
}

@JsonSerializable()
class InvoiceItem {
  final String id;
  @JsonKey(name: 'invoice_id')
  final String invoiceId;
  @JsonKey(name: 'product_id')
  final String? productId;
  final String description;
  final double quantity;
  @JsonKey(name: 'unit_price')
  final double unitPrice;
  @JsonKey(name: 'tax_rate')
  final double taxRate;
  @JsonKey(name: 'discount_percent')
  final double discountPercent;
  @JsonKey(name: 'line_total')
  final double lineTotal;

  InvoiceItem({
    required this.id,
    required this.invoiceId,
    this.productId,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.taxRate,
    required this.discountPercent,
    required this.lineTotal,
  });

  factory InvoiceItem.fromJson(Map<String, dynamic> json) => _$InvoiceItemFromJson(json);
  Map<String, dynamic> toJson() => _$InvoiceItemToJson(this);
}

@JsonSerializable()
class Customer {
  final String id;
  @JsonKey(name: 'organization_id')
  final String organizationId;
  final String name;
  final String? email;
  final String? phone;
  final Map<String, dynamic>? address;
  final String? gstin;
  final List<String>? tags;
  final String? notes;

  Customer({
    required this.id,
    required this.organizationId,
    required this.name,
    this.email,
    this.phone,
    this.address,
    this.gstin,
    this.tags,
    this.notes,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => _$CustomerFromJson(json);
  Map<String, dynamic> toJson() => _$CustomerToJson(this);
}

@JsonSerializable()
class Payment {
  final String id;
  @JsonKey(name: 'invoice_id')
  final String invoiceId;
  final double amount;
  @JsonKey(name: 'payment_method')
  final String paymentMethod;
  @JsonKey(name: 'payment_date')
  final DateTime paymentDate;
  @JsonKey(name: 'reference_number')
  final String? referenceNumber;
  final String? notes;

  Payment({
    required this.id,
    required this.invoiceId,
    required this.amount,
    required this.paymentMethod,
    required this.paymentDate,
    this.referenceNumber,
    this.notes,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => _$PaymentFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentToJson(this);
}
