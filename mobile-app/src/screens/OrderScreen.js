import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';

const OrderScreen = ({ navigation, route }) => {
  const { shop } = route.params;

  // Build available services from printingServices schema
  const availableServices = useMemo(() => {
    const services = [];
    const ps = shop?.printingServices || {};

    // Helper to push if price > 0
    const pushIfValid = (code, name, price, unit) => {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) return;
      services.push({
        id: code, // synthetic id for client-side selection
        code,
        name,
        unit, // e.g., 'per page', 'per document', 'per piece'
        price: numericPrice,
      });
    };

    // Basic printing
    pushIfValid('bw_single', 'B/W Single-Sided', ps?.blackWhite?.singleSidedPrice, 'per page');
    pushIfValid('bw_double', 'B/W Double-Sided', ps?.blackWhite?.doubleSidedPrice, 'per page');
    pushIfValid('color_single', 'Color Single-Sided', ps?.color?.singleSidedPrice, 'per page');
    pushIfValid('color_double', 'Color Double-Sided', ps?.color?.doubleSidedPrice, 'per page');

    // Paper sizes
    pushIfValid('a4', 'A4 Size', ps?.a4Size, 'per page');
    pushIfValid('a3', 'A3 Size', ps?.a3Size, 'per page');
    pushIfValid('photo', 'Photo Paper', ps?.photoPaper, 'per page');

    // Additional services
    pushIfValid('lamination', 'Lamination', ps?.lamination, 'per page');
    pushIfValid('binding', 'Binding', ps?.binding, 'per document');
    pushIfValid('scanning', 'Scanning', ps?.scanning, 'per page');

    // Stationery (per piece)
    pushIfValid('pen', 'Pen', ps?.pen, 'per piece');
    pushIfValid('notebook', 'Notebook', ps?.notebook, 'per piece');
    pushIfValid('file', 'File', ps?.file, 'per piece');
    pushIfValid('stapler', 'Stapler', ps?.stapler, 'per piece');

    return services;
  }, [shop]);

  const [files, setFiles] = useState([]);
  const [fileOptions, setFileOptions] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedPages, setDetectedPages] = useState(0);

  const updateFileOption = (fileIndex, option, value) => {
    setFileOptions(prev => ({
      ...prev,
      [fileIndex]: {
        ...(prev[fileIndex] || {}),
        [option]: value,
      },
    }));
  };

  const refreshDetectedPages = async (filesList) => {
    let total = 0;
    for (let i = 0; i < filesList.length; i++) {
      try {
        const form = new FormData();
        form.append('files', {
          uri: filesList[i].uri,
          type: filesList[i].mimeType || 'application/pdf',
          name: filesList[i].name || `document_${i + 1}.pdf`,
        });
        const resp = await axios.post('/api/orders/inspect', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const pages = Number(resp?.data?.totalPdfPages) || 0;
        updateFileOption(i, 'pages', pages);
        total += pages;
      } catch (_) {
        updateFileOption(i, 'pages', 0);
      }
    }
    setDetectedPages(total);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles = result.assets.filter(asset =>
          !files.some(existing => existing.uri === asset.uri)
        );
        const next = [...files, ...newFiles];

        // default options per added file (copies + per-file service selection)
        const nextOptions = { ...fileOptions };
        newFiles.forEach((_, idx) => {
          const fileIndex = files.length + idx;
          nextOptions[fileIndex] = {
            copies: 1,
            serviceId: null,
            pages: 0,
          };
        });

        setFiles(next);
        setFileOptions(nextOptions);
        refreshDetectedPages(next);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick documents');
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    const nextOptions = {};
    Object.keys(fileOptions).forEach((key) => {
      const num = Number(key);
      if (num < index) nextOptions[num] = fileOptions[key];
      if (num > index) nextOptions[num - 1] = fileOptions[key];
    });
    setFileOptions(nextOptions);

    refreshDetectedPages(newFiles);
  };

  // Calculate total using per-file page count, price per page, and quantity (copies)
  const calculateTotal = () => {
    let total = 0;
    files.forEach((file, index) => {
      const options = fileOptions[index] || {};
      const service = availableServices.find(s => s.id === options.serviceId);
      const copies = Number(options.copies || 1);
      const pages = Number(options.pages || 0);
      const pricePerPage = Number(service?.price || 0);
      // Validation: must have valid service, pages > 0, pricePerPage > 0, copies > 0
      if (!service || !Number.isFinite(copies) || copies < 1) return;
      if (!Number.isFinite(pages) || pages < 1) return;
      if (!Number.isFinite(pricePerPage) || pricePerPage <= 0) return;
      // Only multiply by copies if unit is per page or per document
      if (service.unit === 'per page') {
        total += pages * pricePerPage * copies;
      } else if (service.unit === 'per document') {
        total += pricePerPage * copies;
      } else {
        // For per piece or other units, just multiply by copies
        total += pricePerPage * copies;
      }
    });
    return total;
  };

  const handlePlaceOrder = async () => {
    if (files.length === 0) {
      Alert.alert('Error', 'Please upload at least one document');
      return;
    }

    for (let i = 0; i < files.length; i += 1) {
      const option = fileOptions[i] || {};
      if (!option.serviceId) {
        Alert.alert('Error', `Please select a service for file ${i + 1}`);
        return;
      }
      if (!Number.isFinite(Number(option.copies || 0)) || Number(option.copies) < 1) {
        Alert.alert('Error', `Please set a valid copies value for file ${i + 1}`);
        return;
      }
    }

    const totalAmount = calculateTotal();

    navigation.navigate('OrderConfirmation', {
      shop,
      files,
      fileOptions,
      notes,
      totalAmount,
      availableServices,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView style={styles.scrollContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Place Order</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{shop.shopName}</Text>
        <Text style={styles.shopAddress}>
          {shop.address?.shopNumber}, {shop.address?.street}, {shop.address?.city}
        </Text>
      </View>

      {/* SECTION 1: SERVICES & PRICES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services & Pricing</Text>
        {availableServices.length === 0 ? (
          <Text style={{ color: '#6b7280' }}>No services available.</Text>
        ) : (
          availableServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>₹{service.price} / {service.unit}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* SECTION 2: UPLOAD DOCUMENTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Documents</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
          <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
          <Text style={styles.uploadButtonText}>Upload PDF Files</Text>
        </TouchableOpacity>
        {detectedPages > 0 && (
          <Text style={{ marginTop: 8, color: '#374151' }}>Total Pages Detected: {detectedPages}</Text>
        )}
      </View>

      {/* SECTION 3: FILES WITH SERVICE ASSIGNMENT */}
      {files.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Files ({files.length})</Text>
          <View style={styles.filesList}>
            {files.map((file, index) => {
              const options = fileOptions[index] || { copies: 1, serviceId: null };
              const selectedService = availableServices.find(s => s.id === options.serviceId);
              const serviceOptions = availableServices.slice(0, 4);
              // Calculate file total for display
              let fileTotal = 0;
              const pages = Number(options.pages || 0);
              const pricePerPage = Number(selectedService?.price || 0);
              const copies = Number(options.copies || 1);
              if (selectedService && pages > 0 && pricePerPage > 0 && copies > 0) {
                if (selectedService.unit === 'per page') {
                  fileTotal = pages * pricePerPage * copies;
                } else if (selectedService.unit === 'per document') {
                  fileTotal = pricePerPage * copies;
                } else {
                  fileTotal = pricePerPage * copies;
                }
              }
              return (
                <View key={index} style={styles.fileItemContainer}>
                  {/* File Header */}
                  <View style={styles.fileItemHeader}>
                    <View style={styles.fileItemLeft}>
                      <Ionicons name="document-text" size={22} color="#3b82f6" />
                      <View style={styles.fileItemInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileService}>
                          Service: {selectedService ? selectedService.name : 'Not selected'}
                        </Text>
                        <Text style={styles.filePages}>
                          Pages: {options.pages || 0}
                        </Text>
                        {selectedService && (
                          <>
                            <Text style={styles.filePages}>
                              Price per {selectedService.unit === 'per page' ? 'page' : selectedService.unit === 'per document' ? 'document' : 'item'}: ₹{selectedService.price}
                            </Text>
                            <Text style={styles.filePages}>
                              Copies: {copies}
                            </Text>
                            <Text style={styles.filePages}>
                              File Total: ₹{fileTotal.toFixed(2)}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={styles.fileItemRight}>
                      <TouchableOpacity 
                        onPress={async () => {
                          try {
                            let targetUri = file.uri;
                            if (Platform.OS === 'android') {
                              // Always copy to cache and get content URI
                              const cachePath = `${FileSystem.cacheDirectory}${file.name || `document_${Date.now()}.pdf`}`;
                              await FileSystem.copyAsync({
                                from: file.uri,
                                to: cachePath,
                              });
                              const contentUri = await FileSystem.getContentUriAsync(cachePath);
                              await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                data: contentUri,
                                flags: 1, // 1 = FLAG_GRANT_READ_URI_PERMISSION
                                type: 'application/pdf',
                              });
                            } else {
                              await Linking.openURL(file.uri);
                            }
                          } catch (error) {
                            console.log('View PDF error', error);
                            Alert.alert('Error', 'Unable to open PDF, please install a PDF viewer app');
                          }
                        }} 
                        style={styles.viewPdfButton}
                      >
                        <Ionicons name="eye" size={20} color="#3b82f6" />
                        <Text style={styles.viewPdfText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeFile(index)}>
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* File Options */}
                  <View style={styles.fileOptionsDivider} />
                  <View style={styles.fileOptionsContainer}>
                    <Text style={[styles.optionLabel, { marginBottom: 8 }]}>Choose Service:</Text>
                    <View style={styles.optionButtons}>
                      {serviceOptions.length > 0 ? (
                        serviceOptions.map(service => {
                          const active = selectedService?.id === service.id;
                          return (
                            <TouchableOpacity
                              key={service.id}
                              style={[styles.optionButton, active && styles.optionButtonActive]}
                              onPress={() => updateFileOption(index, 'serviceId', service.id)}
                            >
                              <Text style={[styles.optionButtonText, active && styles.optionButtonTextActive]}>
                                {service.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={styles.optionValue}>No services available</Text>
                      )}
                    </View>

                    <View style={styles.optionRow}> 
                      <Text style={styles.optionLabel}>Copies:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateFileOption(index, 'copies', Math.max(1, Number(options.copies || 1) - 1))}
                        >
                          <Ionicons name="remove" size={16} color="#3b82f6" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{options.copies || 1}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateFileOption(index, 'copies', Number(options.copies || 1) + 1)}
                        >
                          <Ionicons name="add" size={16} color="#3b82f6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* SECTION 4: ADDITIONAL NOTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any special instructions or notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* SECTION 5: TOTAL & ORDER */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.orderButton, loading && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.orderButtonText}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  shopInfo: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  shopAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  serviceSelectedInfo: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  servicePrice: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
  },
  serviceTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    marginLeft: 8,
    fontWeight: '600',
  },
  filesList: {
    marginTop: 16,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  fileItemContainer: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  fileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  fileItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileService: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4,
  },
  filePages: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  fileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    padding: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  viewPdfText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '600',
  },
  fileOptionsDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  fileOptionsContainer: {
    padding: 14,
  },
  fileOptions: {
    marginTop: 10,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionButtonText: {
    fontSize: 12,
    color: '#334155',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  totalSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  orderButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderScreen;
