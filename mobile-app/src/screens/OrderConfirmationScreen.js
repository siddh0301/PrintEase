import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const OrderConfirmationScreen = ({ navigation, route }) => {
  const { shop, files, fileOptions, notes, totalAmount, availableServices } = route.params;

  const handleConfirmOrder = async () => {
    try {
      const formData = new FormData();
      formData.append('shopId', shop._id);

      const items = files.map((file, index) => {
        const options = fileOptions[index] || {};
        const service = availableServices.find(s => s.id === options.serviceId);
        const pages = Number(options.pages || 0);
        const quantity = Number(options.copies || 1);
        const price = Number(service?.price || 0);
        
        // Calculate total: for per page = pages * price * qty, else price * qty
        let itemTotal = 0;
        if (service?.unit === 'per page') {
          itemTotal = pages * price * quantity;
        } else {
          itemTotal = price * quantity;
        }
        
        return {
          code: service?.code || 'unknown',
          name: service?.name || 'Unknown Service',
          unit: service?.unit || 'per page',
          price: price,
          quantity: quantity,
          pages: pages,
          totalPrice: itemTotal,
          fileName: file.name,
        };
      });
      formData.append('items', JSON.stringify(items));

      formData.append('deliveryAddress', JSON.stringify({
        street: 'Customer Address',
        city: 'Customer City',
        state: 'Customer State',
        pincode: '123456',
        phone: 'Customer Phone'
      }));
      
      formData.append('fileOptions', JSON.stringify(fileOptions));
      formData.append('notes', notes);
      formData.append('totalAmount', totalAmount);
      
      files.forEach((file, idx) => {
        formData.append('files', {
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          name: file.name || `document_${idx + 1}.pdf`,
        });
      });

      const response = await axios.post('/api/orders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Your Order',
        `Order #${response.data.order.orderNumber} has been placed successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Payment', { order: response.data.order })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Confirmation</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {files.map((file, index) => {
          const options = fileOptions[index] || {};
          const service = availableServices.find(s => s.id === options.serviceId);
          const pages = options.pages || 0;
          const copies = options.copies || 1;
          const cost = service ? (Number(service.price) * copies * (service.unit === 'per page' ? pages : 1)) : 0;

          return (
            <View key={index} style={styles.fileSummary}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileDetail}>Pages: {pages}</Text>
              <Text style={styles.fileDetail}>Price: ₹{service ? service.price.toFixed(2) : '0.00'}</Text>
              <Text style={styles.fileDetail}>Service: {service ? service.name : 'Not selected'}</Text>
              <Text style={styles.fileDetail}>Copies: {copies}</Text>

              <Text style={styles.fileDetail}>Cost: ₹{cost.toFixed(2)}</Text>
            </View>
          );
        })}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.confirmSection}>
        <Text style={styles.confirmText}>Are you sure you want to place this order?</Text>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
          <Text style={styles.confirmButtonText}>Confirm & Print</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  fileSummary: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  fileDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
  confirmSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;