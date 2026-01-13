// Node Configuration Components
// Har node type ka apna unique configuration UI

import React from 'react'
import { Button } from '@/components/ui/button'

// Helper function to update node parameters
export const updateNodeParam = (
  nodes: any[],
  selectedNode: any,
  setNodes: (nodes: any[]) => void,
  setSelectedNode: (node: any) => void,
  paramPath: string,
  value: any
) => {
  const keys = paramPath.split('.')
  const updated = nodes.map(n => {
    if (n.node_id !== selectedNode.node_id) return n
    
    const params = { ...n.parameters }
    let current = params
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current[keys[i]] = { ...current[keys[i]] }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    return { ...n, parameters: params }
  })
  
  setNodes(updated)
  
  const newParams = { ...selectedNode.parameters }
  let current = newParams
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {}
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
  setSelectedNode({ ...selectedNode, parameters: newParams })
}

// Input component with label
export const ConfigInput = ({ label, value, onChange, type = 'text', placeholder = '', rows = 3 }: any) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    {type === 'textarea' ? (
      <textarea
        className="w-full px-3 py-2 border rounded-lg text-sm"
        rows={rows}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : type === 'select' ? (
      <select
        className="w-full px-3 py-2 border rounded-lg text-sm"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {/* Options will be passed as children */}
      </select>
    ) : (
      <input
        type={type}
        className="w-full px-3 py-2 border rounded-lg text-sm"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
)

// Node Configuration Templates
export const NODE_CONFIGS: Record<string, any> = {
  // SMS Node
  send_sms: {
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Twilio', 'Nexmo', 'AWS SNS'], required: true },
      { key: 'api_key', label: 'API Key', type: 'text', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
      { key: 'from', label: 'From Number', type: 'text', placeholder: '+1234567890', required: true },
      { key: 'to', label: 'To Number', type: 'text', placeholder: '+91XXXXXXXXXX', required: true },
      { key: 'message', label: 'Message', type: 'textarea', required: true }
    ]
  },

  // Slack Node
  slack: {
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...', required: true },
      { key: 'channel', label: 'Channel', type: 'text', placeholder: '#general', required: false },
      { key: 'username', label: 'Bot Username', type: 'text', placeholder: 'Automation Bot', required: false },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
      { key: 'icon_emoji', label: 'Icon Emoji', type: 'text', placeholder: ':robot_face:', required: false }
    ]
  },

  // Telegram Node
  telegram: {
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', required: true },
      { key: 'chat_id', label: 'Chat ID', type: 'text', required: true },
      { key: 'message', label: 'Message', type: 'textarea', required: true },
      { key: 'parse_mode', label: 'Parse Mode', type: 'select', options: ['', 'Markdown', 'HTML'], required: false }
    ]
  },

  // Discord Node
  discord: {
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', required: true },
      { key: 'username', label: 'Bot Username', type: 'text', placeholder: 'Automation Bot', required: false },
      { key: 'content', label: 'Message', type: 'textarea', required: true },
      { key: 'avatar_url', label: 'Avatar URL', type: 'text', required: false }
    ]
  },

  // GraphQL Node
  graphql: {
    fields: [
      { key: 'endpoint', label: 'GraphQL Endpoint', type: 'text', placeholder: 'https://api.example.com/graphql', required: true },
      { key: 'query', label: 'Query', type: 'textarea', placeholder: 'query { users { id name } }', rows: 6, required: true },
      { key: 'variables', label: 'Variables (JSON)', type: 'textarea', placeholder: '{"id": 123}', rows: 3, required: false },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer token"}', rows: 3, required: false }
    ]
  },

  // PostgreSQL Node
  postgres: {
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { key: 'port', label: 'Port', type: 'number', placeholder: '5432', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'ssl', label: 'Use SSL', type: 'checkbox', required: false },
      { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users WHERE ...', rows: 5, required: true }
    ]
  },

  // MySQL Node
  mysql: {
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { key: 'port', label: 'Port', type: 'number', placeholder: '3306', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'user', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users WHERE ...', rows: 5, required: true }
    ]
  },

  // MongoDB Node
  mongodb: {
    fields: [
      { key: 'connection_string', label: 'Connection String', type: 'text', placeholder: 'mongodb://localhost:27017', required: true },
      { key: 'database', label: 'Database', type: 'text', required: true },
      { key: 'collection', label: 'Collection', type: 'text', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['find', 'findOne', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], required: true },
      { key: 'query', label: 'Query (JSON)', type: 'textarea', placeholder: '{"status": "active"}', rows: 3, required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '{"name": "John"}', rows: 3, required: false }
    ]
  },

  // Redis Node
  redis: {
    fields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost', required: true },
      { key: 'port', label: 'Port', type: 'number', placeholder: '6379', required: true },
      { key: 'password', label: 'Password', type: 'password', required: false },
      { key: 'operation', label: 'Operation', type: 'select', options: ['get', 'set', 'del', 'exists', 'expire', 'keys'], required: true },
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'text', required: false },
      { key: 'ttl', label: 'TTL (seconds)', type: 'number', required: false }
    ]
  },

  // Supabase Node
  supabase: {
    fields: [
      { key: 'url', label: 'Supabase URL', type: 'text', placeholder: 'https://xxx.supabase.co', required: true },
      { key: 'key', label: 'Anon Key', type: 'password', required: true },
      { key: 'table', label: 'Table', type: 'text', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['select', 'insert', 'update', 'delete'], required: true },
      { key: 'filter', label: 'Filter (e.g., eq.id.123)', type: 'text', required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '{"name": "John"}', rows: 3, required: false }
    ]
  },

  // Switch Node
  switch: {
    fields: [
      { key: 'variable', label: 'Variable to Check', type: 'text', placeholder: '{{status}}', required: true },
      { key: 'cases', label: 'Cases (JSON)', type: 'textarea', placeholder: '[{"value": "approved", "output": 1}, {"value": "rejected", "output": 2}]', rows: 6, required: true },
      { key: 'default_output', label: 'Default Output', type: 'number', placeholder: '0', required: false }
    ]
  },

  // Transform Node
  transform: {
    fields: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['json', 'code'], required: true },
      { key: 'mapping', label: 'Field Mapping (JSON)', type: 'textarea', placeholder: '{"newField": "{{oldField}}", "status": "active"}', rows: 6, required: false },
      { key: 'code', label: 'JavaScript Code', type: 'textarea', placeholder: 'return items.map(item => ({ ...item, processed: true }))', rows: 8, required: false }
    ]
  },

  // Filter Node
  filter: {
    fields: [
      { key: 'field', label: 'Field to Filter', type: 'text', placeholder: 'status', required: true },
      { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'not_equals', 'contains', 'not_contains', 'greater', 'less', 'exists', 'not_exists'], required: true },
      { key: 'value', label: 'Value', type: 'text', required: false }
    ]
  },

  // Sort Node
  sort: {
    fields: [
      { key: 'field', label: 'Field to Sort By', type: 'text', placeholder: 'created_at', required: true },
      { key: 'order', label: 'Order', type: 'select', options: ['asc', 'desc'], required: true }
    ]
  },

  // Aggregate Node
  aggregate: {
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', options: ['sum', 'count', 'average', 'min', 'max'], required: true },
      { key: 'field', label: 'Field', type: 'text', placeholder: 'amount', required: false },
      { key: 'group_by', label: 'Group By', type: 'text', placeholder: 'category', required: false }
    ]
  },

  // Code Node
  code: {
    fields: [
      { key: 'language', label: 'Language', type: 'select', options: ['javascript', 'python'], required: true },
      { key: 'code', label: 'Code', type: 'textarea', placeholder: '// Process items\nreturn items.map(item => ({ ...item, processed: true }))', rows: 12, required: true }
    ]
  },

  // OpenAI Node
  openai: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'], required: true },
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Write a professional email...', rows: 6, required: true },
      { key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', required: false },
      { key: 'max_tokens', label: 'Max Tokens', type: 'number', placeholder: '1000', required: false }
    ]
  },

  // Stripe Node
  stripe: {
    fields: [
      { key: 'api_key', label: 'Secret Key', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create_payment', 'create_customer', 'create_subscription', 'get_payment', 'refund'], required: true },
      { key: 'amount', label: 'Amount (cents)', type: 'number', placeholder: '1000', required: false },
      { key: 'currency', label: 'Currency', type: 'text', placeholder: 'usd', required: false },
      { key: 'customer_email', label: 'Customer Email', type: 'email', required: false },
      { key: 'description', label: 'Description', type: 'text', required: false }
    ]
  },

  // Google Sheets Node
  google_sheets: {
    fields: [
      { key: 'credentials', label: 'Service Account JSON', type: 'textarea', placeholder: '{"type": "service_account", ...}', rows: 4, required: true },
      { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text', required: true },
      { key: 'sheet_name', label: 'Sheet Name', type: 'text', placeholder: 'Sheet1', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['read', 'append', 'update', 'clear'], required: true },
      { key: 'range', label: 'Range', type: 'text', placeholder: 'A1:Z100', required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '[["Name", "Email"], ["John", "john@example.com"]]', rows: 4, required: false }
    ]
  },

  // Delay Node
  delay: {
    fields: [
      { key: 'amount', label: 'Delay Amount', type: 'number', placeholder: '5', required: true },
      { key: 'unit', label: 'Unit', type: 'select', options: ['seconds', 'minutes', 'hours', 'days'], required: true }
    ]
  },

  // SOAP Node
  soap: {
    fields: [
      { key: 'endpoint', label: 'SOAP Endpoint', type: 'text', placeholder: 'https://api.example.com/soap', required: true },
      { key: 'action', label: 'SOAP Action', type: 'text', required: true },
      { key: 'envelope', label: 'SOAP Envelope (XML)', type: 'textarea', placeholder: '<soap:Envelope>...</soap:Envelope>', rows: 8, required: true },
      { key: 'headers', label: 'HTTP Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "text/xml"}', rows: 3, required: false }
    ]
  },

  // Webhook Response Node
  webhook_response: {
    fields: [
      { key: 'status_code', label: 'Status Code', type: 'number', placeholder: '200', required: true },
      { key: 'body', label: 'Response Body (JSON)', type: 'textarea', placeholder: '{"success": true, "message": "OK"}', rows: 4, required: true },
      { key: 'headers', label: 'Response Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}', rows: 3, required: false }
    ]
  },

  // Email Trigger Node
  email_trigger: {
    fields: [
      { key: 'provider', label: 'Email Provider', type: 'select', options: ['Gmail', 'Outlook', 'IMAP'], required: true },
      { key: 'email', label: 'Email Address', type: 'email', required: true },
      { key: 'password', label: 'Password / App Password', type: 'password', required: true },
      { key: 'folder', label: 'Folder to Monitor', type: 'text', placeholder: 'INBOX', required: true },
      { key: 'filter', label: 'Filter (subject/from)', type: 'text', required: false }
    ]
  },

  // Manual Trigger Node
  manual: {
    fields: [
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'This workflow will be triggered manually...', rows: 3, required: false }
    ]
  },

  // Stop & Error Node
  stop: {
    fields: [
      { key: 'error_message', label: 'Error Message', type: 'text', placeholder: 'Workflow stopped due to error', required: false },
      { key: 'send_notification', label: 'Send Notification', type: 'checkbox', required: false },
      { key: 'notification_email', label: 'Notification Email', type: 'email', required: false }
    ]
  },

  // Split Node
  split: {
    fields: [
      { key: 'field', label: 'Field to Split', type: 'text', placeholder: 'full_name', required: true },
      { key: 'separator', label: 'Separator', type: 'text', placeholder: ' ', required: true },
      { key: 'output_fields', label: 'Output Fields (comma-separated)', type: 'text', placeholder: 'first_name,last_name', required: true }
    ]
  },

  // Set Variable Node
  set: {
    fields: [
      { key: 'variable_name', label: 'Variable Name', type: 'text', placeholder: 'my_variable', required: true },
      { key: 'value', label: 'Value', type: 'text', placeholder: '{{some_value}}', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['string', 'number', 'boolean', 'object'], required: true }
    ]
  },

  // Read File Node
  read_file: {
    fields: [
      { key: 'path', label: 'File Path', type: 'text', placeholder: '/path/to/file.txt', required: true },
      { key: 'encoding', label: 'Encoding', type: 'select', options: ['utf8', 'base64', 'binary'], required: true },
      { key: 'as_json', label: 'Parse as JSON', type: 'checkbox', required: false }
    ]
  },

  // Write File Node
  write_file: {
    fields: [
      { key: 'path', label: 'File Path', type: 'text', placeholder: '/path/to/file.txt', required: true },
      { key: 'content', label: 'Content', type: 'textarea', placeholder: 'File content...', rows: 6, required: true },
      { key: 'encoding', label: 'Encoding', type: 'select', options: ['utf8', 'base64', 'binary'], required: true },
      { key: 'append', label: 'Append (not overwrite)', type: 'checkbox', required: false }
    ]
  },

  // Google Drive Node
  google_drive: {
    fields: [
      { key: 'credentials', label: 'Service Account JSON', type: 'textarea', placeholder: '{"type": "service_account", ...}', rows: 4, required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['list', 'upload', 'download', 'delete', 'share'], required: true },
      { key: 'folder_id', label: 'Folder ID', type: 'text', required: false },
      { key: 'file_name', label: 'File Name', type: 'text', required: false },
      { key: 'file_content', label: 'File Content', type: 'textarea', rows: 4, required: false }
    ]
  },

  // Dropbox Node
  dropbox: {
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['list', 'upload', 'download', 'delete', 'share'], required: true },
      { key: 'path', label: 'Path', type: 'text', placeholder: '/folder/file.txt', required: true },
      { key: 'content', label: 'Content (for upload)', type: 'textarea', rows: 4, required: false }
    ]
  },

  // AWS S3 Node
  aws_s3: {
    fields: [
      { key: 'access_key', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secret_key', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1', required: true },
      { key: 'bucket', label: 'Bucket Name', type: 'text', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['list', 'upload', 'download', 'delete'], required: true },
      { key: 'key', label: 'Object Key', type: 'text', placeholder: 'folder/file.txt', required: false },
      { key: 'content', label: 'Content (for upload)', type: 'textarea', rows: 4, required: false }
    ]
  },

  // HubSpot Node
  hubspot: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'resource', label: 'Resource', type: 'select', options: ['contacts', 'companies', 'deals', 'tickets'], required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create', 'get', 'update', 'delete', 'list'], required: true },
      { key: 'id', label: 'Record ID', type: 'text', required: false },
      { key: 'properties', label: 'Properties (JSON)', type: 'textarea', placeholder: '{"email": "john@example.com", "firstname": "John"}', rows: 4, required: false }
    ]
  },

  // Salesforce Node
  salesforce: {
    fields: [
      { key: 'instance_url', label: 'Instance URL', type: 'text', placeholder: 'https://yourinstance.salesforce.com', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'object', label: 'Object', type: 'select', options: ['Account', 'Contact', 'Lead', 'Opportunity'], required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create', 'get', 'update', 'delete', 'query'], required: true },
      { key: 'id', label: 'Record ID', type: 'text', required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '{"Name": "Acme Corp"}', rows: 4, required: false },
      { key: 'soql', label: 'SOQL Query', type: 'textarea', placeholder: 'SELECT Id, Name FROM Account', rows: 3, required: false }
    ]
  },

  // Pipedrive Node
  pipedrive: {
    fields: [
      { key: 'api_token', label: 'API Token', type: 'password', required: true },
      { key: 'resource', label: 'Resource', type: 'select', options: ['deals', 'persons', 'organizations', 'activities'], required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create', 'get', 'update', 'delete', 'list'], required: true },
      { key: 'id', label: 'Record ID', type: 'text', required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '{"title": "New Deal"}', rows: 4, required: false }
    ]
  },

  // Zoho CRM Node
  zoho_crm: {
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'module', label: 'Module', type: 'select', options: ['Leads', 'Contacts', 'Accounts', 'Deals'], required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create', 'get', 'update', 'delete', 'search'], required: true },
      { key: 'id', label: 'Record ID', type: 'text', required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '{"Last_Name": "Doe", "Email": "john@example.com"}', rows: 4, required: false }
    ]
  },

  // PayPal Node
  paypal: {
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
      { key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'], required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create_payment', 'execute_payment', 'get_payment', 'refund'], required: true },
      { key: 'amount', label: 'Amount', type: 'number', placeholder: '100.00', required: false },
      { key: 'currency', label: 'Currency', type: 'text', placeholder: 'USD', required: false },
      { key: 'description', label: 'Description', type: 'text', required: false }
    ]
  },

  // Razorpay Node
  razorpay: {
    fields: [
      { key: 'key_id', label: 'Key ID', type: 'text', required: true },
      { key: 'key_secret', label: 'Key Secret', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create_order', 'capture_payment', 'get_payment', 'refund'], required: true },
      { key: 'amount', label: 'Amount (paise)', type: 'number', placeholder: '10000', required: false },
      { key: 'currency', label: 'Currency', type: 'text', placeholder: 'INR', required: false },
      { key: 'receipt', label: 'Receipt ID', type: 'text', required: false }
    ]
  },

  // Excel Node
  excel: {
    fields: [
      { key: 'file_path', label: 'File Path', type: 'text', placeholder: '/path/to/file.xlsx', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['read', 'write', 'append'], required: true },
      { key: 'sheet_name', label: 'Sheet Name', type: 'text', placeholder: 'Sheet1', required: true },
      { key: 'range', label: 'Range', type: 'text', placeholder: 'A1:Z100', required: false },
      { key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '[["Name", "Email"], ["John", "john@example.com"]]', rows: 4, required: false }
    ]
  },

  // Google Calendar Node
  google_calendar: {
    fields: [
      { key: 'credentials', label: 'Service Account JSON', type: 'textarea', placeholder: '{"type": "service_account", ...}', rows: 4, required: true },
      { key: 'calendar_id', label: 'Calendar ID', type: 'text', placeholder: 'primary', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['list', 'create', 'update', 'delete'], required: true },
      { key: 'event_id', label: 'Event ID', type: 'text', required: false },
      { key: 'summary', label: 'Event Title', type: 'text', required: false },
      { key: 'start_time', label: 'Start Time (ISO)', type: 'text', placeholder: '2025-01-01T10:00:00Z', required: false },
      { key: 'end_time', label: 'End Time (ISO)', type: 'text', placeholder: '2025-01-01T11:00:00Z', required: false }
    ]
  },

  // Notion Node
  notion: {
    fields: [
      { key: 'api_key', label: 'Integration Token', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['create_page', 'update_page', 'query_database', 'get_page'], required: true },
      { key: 'database_id', label: 'Database ID', type: 'text', required: false },
      { key: 'page_id', label: 'Page ID', type: 'text', required: false },
      { key: 'properties', label: 'Properties (JSON)', type: 'textarea', placeholder: '{"Name": {"title": [{"text": {"content": "New Page"}}]}}', rows: 6, required: false }
    ]
  },

  // Airtable Node
  airtable: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'base_id', label: 'Base ID', type: 'text', required: true },
      { key: 'table_name', label: 'Table Name', type: 'text', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['list', 'create', 'update', 'delete', 'get'], required: true },
      { key: 'record_id', label: 'Record ID', type: 'text', required: false },
      { key: 'fields', label: 'Fields (JSON)', type: 'textarea', placeholder: '{"Name": "John", "Email": "john@example.com"}', rows: 4, required: false }
    ]
  },

  // Claude AI Node
  anthropic: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], required: true },
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Write a professional email...', rows: 6, required: true },
      { key: 'max_tokens', label: 'Max Tokens', type: 'number', placeholder: '1000', required: false },
      { key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', required: false }
    ]
  },

  // Google Gemini Node
  gemini: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'select', options: ['gemini-pro', 'gemini-pro-vision'], required: true },
      { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Analyze this data...', rows: 6, required: true },
      { key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', required: false }
    ]
  },

  // Twitter/X Node
  twitter: {
    fields: [
      { key: 'api_key', label: 'API Key', type: 'text', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
      { key: 'access_token', label: 'Access Token', type: 'text', required: true },
      { key: 'access_secret', label: 'Access Token Secret', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['tweet', 'reply', 'retweet', 'like', 'get_tweets'], required: true },
      { key: 'text', label: 'Tweet Text', type: 'textarea', placeholder: 'Your tweet content...', rows: 4, required: false },
      { key: 'tweet_id', label: 'Tweet ID', type: 'text', required: false }
    ]
  },

  // Facebook Node
  facebook: {
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['post', 'get_posts', 'comment', 'like'], required: true },
      { key: 'page_id', label: 'Page ID', type: 'text', required: false },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Your post content...', rows: 4, required: false },
      { key: 'post_id', label: 'Post ID', type: 'text', required: false }
    ]
  },

  // Instagram Node
  instagram: {
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['post_photo', 'post_video', 'get_media', 'comment'], required: true },
      { key: 'image_url', label: 'Image URL', type: 'text', required: false },
      { key: 'caption', label: 'Caption', type: 'textarea', placeholder: 'Your caption...', rows: 4, required: false },
      { key: 'media_id', label: 'Media ID', type: 'text', required: false }
    ]
  },

  // LinkedIn Node
  linkedin: {
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
      { key: 'operation', label: 'Operation', type: 'select', options: ['post', 'get_profile', 'share_article'], required: true },
      { key: 'text', label: 'Post Text', type: 'textarea', placeholder: 'Your LinkedIn post...', rows: 4, required: false },
      { key: 'article_url', label: 'Article URL', type: 'text', required: false }
    ]
  }
}

export default NODE_CONFIGS
