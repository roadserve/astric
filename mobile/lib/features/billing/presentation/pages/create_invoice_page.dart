import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/supabase_config.dart';

class CreateInvoicePage extends ConsumerStatefulWidget {
  const CreateInvoicePage({super.key});

  @override
  ConsumerState<CreateInvoicePage> createState() => _CreateInvoicePageState();
}

class _CreateInvoicePageState extends ConsumerState<CreateInvoicePage> {
  final _formKey = GlobalKey<FormState>();
  
  // Controllers
  final _invoiceNumberController = TextEditingController();
  final _notesController = TextEditingController();
  
  // Data
  Map<String, dynamic>? _selectedCustomer;
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _products = [];
  final List<InvoiceItem> _items = [];
  DateTime _invoiceDate = DateTime.now();
  DateTime _dueDate = DateTime.now().add(const Duration(days: 30));
  String _paymentMethod = 'cash';
  
  // Calculations
  double get _subtotal => _items.fold(0, (sum, item) => sum + item.total);
  double get _taxAmount => _items.fold(0, (sum, item) => sum + item.taxAmount);
  double get _total => _subtotal + _taxAmount;

  @override
  void initState() {
    super.initState();
    _loadData();
    _generateInvoiceNumber();
  }

  Future<void> _loadData() async {
    try {
      // Load customers
      final customersResponse = await SupabaseConfig.client
          .from('customers')
          .select('*')
          .order('name');

      // Load products
      final productsResponse = await SupabaseConfig.client
          .from('products')
          .select('*')
          .order('name');

      setState(() {
        _customers = List<Map<String, dynamic>>.from(customersResponse);
        _products = List<Map<String, dynamic>>.from(productsResponse);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  void _generateInvoiceNumber() {
    final now = DateTime.now();
    final number = 'INV-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${now.millisecondsSinceEpoch.toString().substring(8)}';
    _invoiceNumberController.text = number;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Invoice'),
        actions: [
          IconButton(
            icon: const Icon(Icons.document_scanner),
            onPressed: _scanInvoice,
            tooltip: 'Scan Invoice',
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Invoice Number
            TextFormField(
              controller: _invoiceNumberController,
              decoration: const InputDecoration(
                labelText: 'Invoice Number',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.tag),
              ),
              validator: (value) =>
                  value?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),

            // Customer Selection
            Card(
              child: ListTile(
                leading: const Icon(Icons.person),
                title: Text(_selectedCustomer?['name'] ?? 'Select Customer'),
                subtitle: _selectedCustomer != null
                    ? Text(_selectedCustomer!['email'] ?? '')
                    : null,
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: _selectCustomer,
              ),
            ),
            const SizedBox(height: 16),

            // Dates
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: ListTile(
                      leading: const Icon(Icons.calendar_today),
                      title: const Text('Invoice Date'),
                      subtitle: Text(DateFormat('MMM dd, yyyy').format(_invoiceDate)),
                      onTap: () => _selectDate(true),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Card(
                    child: ListTile(
                      leading: const Icon(Icons.event),
                      title: const Text('Due Date'),
                      subtitle: Text(DateFormat('MMM dd, yyyy').format(_dueDate)),
                      onTap: () => _selectDate(false),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Items Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Items',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                ElevatedButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Item'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Items List
            if (_items.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(Icons.shopping_cart, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 8),
                      Text(
                        'No items added',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return _buildItemCard(item, index);
              }),

            const SizedBox(height: 16),

            // Summary Card
            Card(
              color: Colors.blue[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotal'),
                        Text(
                          '₹${_subtotal.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tax'),
                        Text(
                          '₹${_taxAmount.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '₹${_total.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Payment Method
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              decoration: const InputDecoration(
                labelText: 'Payment Method',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.payment),
              ),
              items: const [
                DropdownMenuItem(value: 'cash', child: Text('Cash')),
                DropdownMenuItem(value: 'upi', child: Text('UPI')),
                DropdownMenuItem(value: 'card', child: Text('Card')),
                DropdownMenuItem(value: 'bank_transfer', child: Text('Bank Transfer')),
                DropdownMenuItem(value: 'cheque', child: Text('Cheque')),
              ],
              onChanged: (value) {
                setState(() => _paymentMethod = value!);
              },
            ),
            const SizedBox(height: 16),

            // Notes
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.note),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saveDraft,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                    ),
                    child: const Text('Save as Draft'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _createInvoice,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                    ),
                    child: const Text('Create Invoice'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildItemCard(InvoiceItem item, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    item.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () {
                    setState(() => _items.removeAt(index));
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Qty: ${item.quantity} × ₹${item.price.toStringAsFixed(2)}'),
                Text(
                  '₹${item.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            if (item.taxRate > 0)
              Text(
                'Tax (${item.taxRate}%): ₹${item.taxAmount.toStringAsFixed(2)}',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectCustomer() async {
    final selected = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Customer'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _customers.length,
            itemBuilder: (context, index) {
              final customer = _customers[index];
              return ListTile(
                title: Text(customer['name'] ?? ''),
                subtitle: Text(customer['email'] ?? ''),
                onTap: () => Navigator.pop(context, customer),
              );
            },
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

    if (selected != null) {
      setState(() => _selectedCustomer = selected);
    }
  }

  Future<void> _selectDate(bool isInvoiceDate) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isInvoiceDate ? _invoiceDate : _dueDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );

    if (picked != null) {
      setState(() {
        if (isInvoiceDate) {
          _invoiceDate = picked;
        } else {
          _dueDate = picked;
        }
      });
    }
  }

  Future<void> _addItem() async {
    final selected = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _ItemSelectionDialog(products: _products),
    );

    if (selected != null) {
      setState(() {
        _items.add(InvoiceItem(
          productId: selected['id'],
          name: selected['name'],
          quantity: selected['quantity'],
          price: selected['price'],
          taxRate: selected['tax_rate'],
        ));
      });
    }
  }

  Future<void> _scanInvoice() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Scan Invoice'),
        content: const Text('AI will scan and extract invoice data automatically.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Implement AI scanning
            },
            child: const Text('Scan'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveDraft() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a customer')),
      );
      return;
    }

    await _saveInvoice('draft');
  }

  Future<void> _createInvoice() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a customer')),
      );
      return;
    }
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one item')),
      );
      return;
    }

    await _saveInvoice('pending');
  }

  Future<void> _saveInvoice(String status) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final invoiceData = {
        'invoice_number': _invoiceNumberController.text,
        'customer_id': _selectedCustomer!['id'],
        'invoice_date': _invoiceDate.toIso8601String(),
        'due_date': _dueDate.toIso8601String(),
        'subtotal': _subtotal,
        'tax_amount': _taxAmount,
        'total_amount': _total,
        'payment_method': _paymentMethod,
        'notes': _notesController.text.isEmpty ? null : _notesController.text,
        'status': status,
      };

      final response = await SupabaseConfig.client
          .from('invoices')
          .insert(invoiceData)
          .select()
          .single();

      final invoiceId = response['id'];

      // Insert invoice items
      final itemsData = _items.map((item) => {
        'invoice_id': invoiceId,
        'product_id': item.productId,
        'quantity': item.quantity,
        'price': item.price,
        'tax_rate': item.taxRate,
        'total': item.total,
      }).toList();

      await SupabaseConfig.client.from('invoice_items').insert(itemsData);

      if (mounted) {
        Navigator.pop(context); // Close loading
        Navigator.pop(context); // Go back
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(status == 'draft'
                ? 'Invoice saved as draft'
                : 'Invoice created successfully'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving invoice: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _invoiceNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }
}

class InvoiceItem {
  final String productId;
  final String name;
  final int quantity;
  final double price;
  final double taxRate;

  InvoiceItem({
    required this.productId,
    required this.name,
    required this.quantity,
    required this.price,
    required this.taxRate,
  });

  double get total => quantity * price;
  double get taxAmount => total * (taxRate / 100);
}

class _ItemSelectionDialog extends StatefulWidget {
  final List<Map<String, dynamic>> products;

  const _ItemSelectionDialog({required this.products});

  @override
  State<_ItemSelectionDialog> createState() => _ItemSelectionDialogState();
}

class _ItemSelectionDialogState extends State<_ItemSelectionDialog> {
  Map<String, dynamic>? _selectedProduct;
  final _quantityController = TextEditingController(text: '1');

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Item'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<Map<String, dynamic>>(
            value: _selectedProduct,
            decoration: const InputDecoration(
              labelText: 'Select Product',
              border: OutlineInputBorder(),
            ),
            items: widget.products.map((product) {
              return DropdownMenuItem(
                value: product,
                child: Text(product['name']),
              );
            }).toList(),
            onChanged: (value) {
              setState(() => _selectedProduct = value);
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _quantityController,
            decoration: const InputDecoration(
              labelText: 'Quantity',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
          ),
          if (_selectedProduct != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Price'),
                      Text('₹${_selectedProduct!['price']}'),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Tax Rate'),
                      Text('${_selectedProduct!['tax_rate']}%'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_selectedProduct == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please select a product')),
              );
              return;
            }

            final quantity = int.tryParse(_quantityController.text) ?? 1;
            Navigator.pop(context, {
              ..._selectedProduct!,
              'quantity': quantity,
            });
          },
          child: const Text('Add'),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _quantityController.dispose();
    super.dispose();
  }
}