import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OrganizationSelectionPage extends ConsumerStatefulWidget {
  const OrganizationSelectionPage({super.key});

  @override
  ConsumerState<OrganizationSelectionPage> createState() => _OrganizationSelectionPageState();
}

class _OrganizationSelectionPageState extends ConsumerState<OrganizationSelectionPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Organization'),
        automaticallyImplyLeading: false,
      ),
      body: const Center(
        child: Text('Organization selection will be implemented here'),
      ),
    );
  }
}
