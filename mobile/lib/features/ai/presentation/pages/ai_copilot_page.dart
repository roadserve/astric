import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/supabase_config.dart';

class AiCopilotPage extends ConsumerStatefulWidget {
  const AiCopilotPage({super.key});

  @override
  ConsumerState<AiCopilotPage> createState() => _AiCopilotPageState();
}

class _AiCopilotPageState extends ConsumerState<AiCopilotPage> {
  final _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Copilot'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              // Show chat history
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // AI Features Grid
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI Features',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    _buildFeatureCard(
                      'Scan Invoice',
                      Icons.document_scanner,
                      Colors.blue,
                      () => _scanInvoice(),
                    ),
                    _buildFeatureCard(
                      'Smart Replies',
                      Icons.auto_awesome,
                      Colors.purple,
                      () => _showSmartReplies(),
                    ),
                    _buildFeatureCard(
                      'Business Insights',
                      Icons.insights,
                      Colors.green,
                      () => _showInsights(),
                    ),
                    _buildFeatureCard(
                      'Ask AI',
                      Icons.chat,
                      Colors.orange,
                      () => _focusChat(),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const Divider(),

          // Chat Messages
          Expanded(
            child: _messages.isEmpty
                ? _buildEmptyChat()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return _buildMessageBubble(message);
                    },
                  ),
          ),

          // Input Area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Ask me anything...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Theme.of(context).primaryColor,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _loading ? null : _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(
      String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyChat() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.smart_toy, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'AI Copilot Ready',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Ask me about your business, scan invoices, or get smart suggestions',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isUser = message['role'] == 'user';
    final text = message['content'] as String;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: isUser ? Theme.of(context).primaryColor : Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isUser ? Colors.white : Colors.black87,
            fontSize: 15,
          ),
        ),
      ),
    );
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final userMessage = _messageController.text.trim();
    _messageController.clear();

    setState(() {
      _messages.add({'role': 'user', 'content': userMessage});
      _loading = true;
    });

    try {
      // Use the new ai_chat function for real AI responses
      final response = await SupabaseConfig.client.functions.invoke(
        'ai_chat',
        body: {
          'message': userMessage,
          'context': 'business_copilot',
          'messages': _messages.length > 10 
              ? _messages.sublist(_messages.length - 10) 
              : _messages,
        },
      );

      final aiReply = response.data['reply'] ?? 
          'I apologize, but I encountered an error. Please try again.';

      setState(() {
        _messages.add({'role': 'assistant', 'content': aiReply});
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': 'Sorry, I encountered an error. Please check your connection and try again.'
        });
        _loading = false;
      });
    }
  }

  Future<void> _scanInvoice() async {
    // For demo, show file picker or camera
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _captureInvoice();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickInvoiceImage();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _captureInvoice() async {
    // Show camera scanner
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Scan Invoice'),
        content: const Text(
            'Camera feature will capture and process invoice using AI OCR.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _processInvoiceWithAI('demo_invoice_url');
            },
            child: const Text('Process Demo'),
          ),
        ],
      ),
    );
  }

  Future<void> _pickInvoiceImage() async {
    // Simulate picking an image
    await _processInvoiceWithAI('demo_invoice_url');
  }

  Future<void> _processInvoiceWithAI(String imageUrl) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Processing invoice with AI...',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
      ),
    );

    try {
      final response = await SupabaseConfig.client.functions.invoke(
        'ai_invoice_parse',
        body: {
          'file_url': imageUrl,
          'organization_id': 'demo_org',
        },
      );

      if (mounted) {
        Navigator.pop(context);
        
        final invoiceData = response.data;
        
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Invoice Scanned!'),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Vendor: ${invoiceData['vendor_name'] ?? 'N/A'}'),
                  Text('Amount: ₹${invoiceData['total_amount'] ?? '0'}'),
                  Text('Date: ${invoiceData['invoice_date'] ?? 'N/A'}'),
                  const SizedBox(height: 16),
                  const Text(
                    'Would you like to create an invoice from this data?',
                    style: TextStyle(fontWeight: FontWeight.bold),
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
                onPressed: () {
                  Navigator.pop(context);
                  // Navigate to create invoice with pre-filled data
                },
                child: const Text('Create Invoice'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error processing invoice: $e')),
        );
      }
    }
  }

  Future<void> _showSmartReplies() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final response = await SupabaseConfig.client.functions.invoke(
        'ai_reply_suggest',
        body: {
          'context': 'payment_reminder',
          'customer_name': 'Demo Customer',
        },
      );

      if (mounted) {
        Navigator.pop(context);

        final suggestions = response.data['suggestions'] as List? ?? [
              'Thank you for your business! Your payment is due.',
              'Gentle reminder: Invoice payment pending.',
              'Please process the pending payment at your earliest convenience.'
            ];

        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Smart Reply Suggestions'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: suggestions.map((suggestion) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(suggestion),
                      trailing: IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () {
                          // Copy to clipboard
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Copied to clipboard')),
                          );
                        },
                      ),
                    ),
                  );
                }).toList(),
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
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _showInsights() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Business Insights'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildInsightCard(
                'Revenue Trend',
                'Your revenue is up 15% this month',
                Icons.trending_up,
                Colors.green,
              ),
              const SizedBox(height: 12),
              _buildInsightCard(
                'Outstanding Payments',
                '5 invoices are overdue',
                Icons.warning,
                Colors.orange,
              ),
              const SizedBox(height: 12),
              _buildInsightCard(
                'Top Customer',
                'ABC Corp contributed 30% of revenue',
                Icons.star,
                Colors.blue,
              ),
              const SizedBox(height: 12),
              _buildInsightCard(
                'Recommendation',
                'Send payment reminders to improve cash flow',
                Icons.lightbulb,
                Colors.purple,
              ),
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

  Widget _buildInsightCard(
      String title, String description, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _focusChat() {
    FocusScope.of(context).requestFocus(FocusNode());
    // Scroll to bottom if needed
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }
}