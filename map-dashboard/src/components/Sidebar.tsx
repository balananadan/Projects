'use client';

import React, { useCallback, useState } from 'react';
import { 
  Card, 
  Select, 
  Button, 
  InputNumber, 
  ColorPicker, 
  Divider,
  Typography,
  Tooltip,
  Modal,
  Form,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  SettingOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useMapStore } from '@/store/mapStore';
import type { ColorRule } from '@/store/mapStore';

const { Title, Text } = Typography;

const operatorOptions = [
  { label: 'Equal (=)', value: '=' },
  { label: 'Less than (<)', value: '<' },
  { label: 'Greater than (>)', value: '>' },
  { label: 'Less than or equal (≤)', value: '<=' },
  { label: 'Greater than or equal (≥)', value: '>=' },
];

const predefinedColors = [
  '#ff4d4f', // Red
  '#ff7a45', // Orange
  '#ffa940', // Yellow
  '#52c41a', // Green
  '#1890ff', // Blue
  '#722ed1', // Purple
  '#eb2f96', // Pink
  '#13c2c2', // Cyan
];

interface ColorRuleFormProps {
  rule?: ColorRule;
  onSave: (rule: ColorRule) => void;
  onCancel: () => void;
}

const ColorRuleForm: React.FC<ColorRuleFormProps> = ({ rule, onSave, onCancel }) => {
  const [form] = Form.useForm();

  const handleSubmit = useCallback(() => {
    form.validateFields().then((values) => {
      const newRule: ColorRule = {
        id: rule?.id || `rule-${Date.now()}`,
        operator: values.operator,
        value: values.value,
        color: values.color,
      };
      onSave(newRule);
      form.resetFields();
    });
  }, [form, rule, onSave]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={rule}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="operator"
        label="Operator"
        rules={[{ required: true, message: 'Please select an operator' }]}
      >
        <Select options={operatorOptions} placeholder="Select operator" />
      </Form.Item>

      <Form.Item
        name="value"
        label="Value"
        rules={[{ required: true, message: 'Please enter a value' }]}
      >
        <InputNumber 
          style={{ width: '100%' }} 
          placeholder="Enter threshold value"
          precision={1}
        />
      </Form.Item>

      <Form.Item
        name="color"
        label="Color"
        rules={[{ required: true, message: 'Please select a color' }]}
      >
        <div className="space-y-2">
          <ColorPicker 
            showText 
            presets={[
              {
                label: 'Recommended',
                colors: predefinedColors,
              },
            ]}
          />
          <div className="flex flex-wrap gap-1">
            {predefinedColors.map((color) => (
              <div
                key={color}
                className="w-6 h-6 rounded border cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => form.setFieldValue('color', color)}
              />
            ))}
          </div>
        </div>
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit">
          {rule ? 'Update' : 'Add'} Rule
        </Button>
      </div>
    </Form>
  );
};

const Sidebar: React.FC = () => {
  const {
    dataSources,
    selectedDataSourceId,
    polygons,
    updateDataSource,
    setSelectedDataSourceId,
  } = useMapStore();

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ColorRule | undefined>();
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);

  const selectedDataSource = dataSources.find(ds => ds.id === selectedDataSourceId);

  // Handle adding/updating color rules
  const handleSaveRule = useCallback((rule: ColorRule) => {
    if (!selectedDataSource) return;

    const existingRuleIndex = selectedDataSource.colorRules.findIndex(r => r.id === rule.id);
    const newRules = [...selectedDataSource.colorRules];

    if (existingRuleIndex >= 0) {
      newRules[existingRuleIndex] = rule;
    } else {
      newRules.push(rule);
    }

    updateDataSource(selectedDataSource.id, { colorRules: newRules });
    setShowRuleModal(false);
    setEditingRule(undefined);
    message.success('Color rule saved successfully');
  }, [selectedDataSource, updateDataSource]);

  // Handle deleting color rules
  const handleDeleteRule = useCallback((ruleId: string) => {
    if (!selectedDataSource) return;

    const newRules = selectedDataSource.colorRules.filter(r => r.id !== ruleId);
    updateDataSource(selectedDataSource.id, { colorRules: newRules });
    message.success('Color rule deleted');
  }, [selectedDataSource, updateDataSource]);

  // Handle editing color rules
  const handleEditRule = useCallback((rule: ColorRule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  }, []);

  // Format operator for display
  const formatOperator = (operator: string) => {
    const mapping: Record<string, string> = {
      '=': '=',
      '<': '<',
      '>': '>',
      '<=': '≤',
      '>=': '≥',
    };
    return mapping[operator] || operator;
  };

  // Get rule description
  const getRuleDescription = (rule: ColorRule) => {
    return `Value ${formatOperator(rule.operator)} ${rule.value}`;
  };

  // Handle adding new data source
  const handleAddDataSource = useCallback(() => {
    setShowDataSourceModal(true);
  }, []);

  return (
    <div className="w-80 bg-white shadow-lg border-l h-full overflow-y-auto">
      <div className="p-4 border-b">
        <Title level={4} className="mb-0 flex items-center">
          <SettingOutlined className="mr-2" />
          Data Sources & Rules
        </Title>
      </div>

      <div className="p-4 space-y-6">
        {/* Data Source Selection */}
        <Card size="small" title="Active Data Source">
          <div className="space-y-3">
            <Select
              style={{ width: '100%' }}
              value={selectedDataSourceId}
              onChange={setSelectedDataSourceId}
              options={dataSources.map(ds => ({
                label: ds.name,
                value: ds.id,
              }))}
            />
            
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddDataSource}
              block
              size="small"
            >
              Add Data Source
            </Button>

            {selectedDataSource && (
              <div className="text-sm text-gray-600">
                <div><strong>Field:</strong> {selectedDataSource.field}</div>
                <div><strong>API:</strong> {selectedDataSource.name}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Color Rules */}
        {selectedDataSource && (
          <Card 
            size="small" 
            title={
              <div className="flex items-center justify-between">
                <span>Color Rules</span>
                <Tooltip title="Rules are applied in order. First matching rule determines the color.">
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
            }
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setShowRuleModal(true)}
              >
                Add Rule
              </Button>
            }
          >
            <div className="space-y-2">
              {selectedDataSource.colorRules.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <Text type="secondary">No color rules defined</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Add rules to automatically color polygons based on data values
                  </Text>
                </div>
              ) : (
                selectedDataSource.colorRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: rule.color }}
                      />
                      <Text className="text-sm">
                        {getRuleDescription(rule)}
                      </Text>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditRule(rule)}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRule(rule.id)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedDataSource.colorRules.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                <strong>Rule Priority:</strong> Rules are checked from top to bottom. 
                The first matching rule determines the polygon color.
              </div>
            )}
          </Card>
        )}

        {/* Polygon Summary */}
        <Card size="small" title="Polygon Summary">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Polygons:</span>
              <span className="font-medium">{polygons.length}</span>
            </div>
            
            {polygons.length > 0 && (
              <>
                <Divider className="my-2" />
                <div className="text-xs text-gray-600">
                  <strong>By Data Source:</strong>
                </div>
                {dataSources.map(ds => {
                  const count = polygons.filter(p => p.dataSourceId === ds.id).length;
                  if (count === 0) return null;
                  
                  return (
                    <div key={ds.id} className="flex justify-between text-xs">
                      <span>{ds.name}:</span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>

        {/* Legend */}
        {selectedDataSource && selectedDataSource.colorRules.length > 0 && (
          <Card size="small" title="Color Legend">
            <div className="space-y-1">
              {selectedDataSource.colorRules.map((rule) => (
                <div key={rule.id} className="flex items-center space-x-2 text-xs">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: rule.color }}
                  />
                  <span>{getRuleDescription(rule)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Color Rule Modal */}
      <Modal
        title={editingRule ? 'Edit Color Rule' : 'Add Color Rule'}
        open={showRuleModal}
        onCancel={() => {
          setShowRuleModal(false);
          setEditingRule(undefined);
        }}
        footer={null}
        width={400}
      >
        <ColorRuleForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowRuleModal(false);
            setEditingRule(undefined);
          }}
        />
      </Modal>

      {/* Add Data Source Modal - Placeholder */}
      <Modal
        title="Add Data Source"
        open={showDataSourceModal}
        onCancel={() => setShowDataSourceModal(false)}
        footer={
          <Button onClick={() => setShowDataSourceModal(false)}>
            Close
          </Button>
        }
      >
        <div className="text-center py-8">
          <Text type="secondary">
            Additional data sources can be implemented as a bonus feature.<br/>
            Currently using Open-Meteo weather data.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;