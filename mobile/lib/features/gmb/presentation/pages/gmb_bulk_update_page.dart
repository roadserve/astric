import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class GmbBulkUpdatePage extends ConsumerStatefulWidget {
  const GmbBulkUpdatePage({super.key});

  @override
  ConsumerState<GmbBulkUpdatePage> createState() => _GmbBulkUpdatePageState();
}

class _GmbBulkUpdatePageState extends ConsumerState<GmbBulkUpdatePage> {
  final _formKey = GlobalKey<FormState>();
  String _selectedUpdateType = 'description';
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _websiteController = TextEditingController();
  final List<String> _selectedLocations = [];

  @override
  void dispose() {
    _descriptionController.dispose();
    _phoneController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bulk Update Profiles'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Info Card
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue.shade700),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Update multiple business profiles at once. Changes will be applied to all selected locations.',
                        style: TextStyle(color: Colors.blue.shade700),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Update Type Selection
            Text(
              'What do you want to update?',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _selectedUpdateType,
              decoration: const InputDecoration(
                labelText: 'Update Type',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'description',
                  child: Text('Business Description'),
                ),
                DropdownMenuItem(
                  value: 'phone',
                  child: Text('Phone Number'),
                ),
                DropdownMenuItem(
                  value: 'website',
                  child: Text('Website URL'),
                ),
                DropdownMenuItem(
                  value: 'hours',
                  child: Text('Business Hours'),
                ),
                DropdownMenuItem(
                  value: 'attributes',
                  child: Text('Business Attributes'),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedUpdateType = value!;
                });
              },
            ),
            const SizedBox(height: 24),
            
            // Update Content
            Text(
              'Enter new information',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _buildUpdateFields(),
            const SizedBox(height: 24),
            
            // Location Selection
            Text(
              'Select locations to update',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            Card(
              child: Column(
                children: [
                  CheckboxListTile(
                    title: const Text('Select All Locations'),
                    value: false,
                    onChanged: (value) {
                      // TODO: Implement select all
                    },
                  ),
                  const Divider(),
                  // TODO: List all locations with checkboxes
                  const ListTile(
                    title: Text('No locations available'),
                    subtitle: Text('Connect a Google account first'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Preview
            if (_selectedLocations.isNotEmpty)
              Card(
                color: Colors.green.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.preview, color: Colors.green.shade700),
                          const SizedBox(width: 8),
                          Text(
                            'Update Preview',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.green.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_selectedLocations.length} locations will be updated',
                        style: TextStyle(color: Colors.green.shade700),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _selectedLocations.isEmpty ? null : _performBulkUpdate,
                    child: const Text('Update All'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpdateFields() {
    switch (_selectedUpdateType) {
      case 'description':
        return TextFormField(
          controller: _descriptionController,
          maxLines: 5,
          decoration: const InputDecoration(
            labelText: 'Business Description',
            hintText: 'Enter a description for all selected locations',
            border: OutlineInputBorder(),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter a description';
            }
            return null;
          },
        );
        
      case 'phone':
        return TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Phone Number',
            hintText: '+91 9876543210',
            border: OutlineInputBorder(),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter a phone number';
            }
            return null;
          },
        );
        
      case 'website':
        return TextFormField(
          controller: _websiteController,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(
            labelText: 'Website URL',
            hintText: 'https://example.com',
            border: OutlineInputBorder(),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter a website URL';
            }
            return null;
          },
        );
        
      case 'hours':
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Business Hours'),
                const SizedBox(height: 8),
                const Text(
                  'Configure business hours for all locations',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    // TODO: Show hours picker dialog
                  },
                  child: const Text('Set Hours'),
                ),
              ],
            ),
          ),
        );
        
      case 'attributes':
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Business Attributes'),
                const SizedBox(height: 8),
                const Text(
                  'Select attributes for all locations',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  children: [
                    FilterChip(
                      label: const Text('Wheelchair Accessible'),
                      selected: false,
                      onSelected: (value) {},
                    ),
                    FilterChip(
                      label: const Text('Free Wi-Fi'),
                      selected: false,
                      onSelected: (value) {},
                    ),
                    FilterChip(
                      label: const Text('Parking Available'),
                      selected: false,
                      onSelected: (value) {},
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
        
      default:
        return const SizedBox.shrink();
    }
  }

  void _performBulkUpdate() {
    if (_formKey.currentState!.validate()) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Updating Profiles'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text('Updating ${_selectedLocations.length} locations...'),
            ],
          ),
        ),
      );

      // TODO: Call gmb_bulk_update Edge Function
      
      Future.delayed(const Duration(seconds: 2), () {
        Navigator.pop(context); // Close progress dialog
        Navigator.pop(context); // Go back
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully updated ${_selectedLocations.length} locations'),
            backgroundColor: Colors.green,
          ),
        );
      });
    }
  }
}
