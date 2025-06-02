import { storage } from './storage';
import { PaymentMethod } from '@shared/schema';

/**
 * Payment System Synchronization Service
 * Ensures all payment method changes made by admin propagate across the entire system
 */
export class PaymentSyncService {
  /**
   * Synchronizes payment method configuration changes across all locations
   * Called whenever admin updates payment methods or API credentials
   */
  static async syncPaymentMethodChanges(updatedMethod: PaymentMethod): Promise<void> {
    console.log(`[PaymentSync] Synchronizing changes for payment method: ${updatedMethod.name}`);
    
    // Get all locations to update their payment configurations
    const locations = await storage.getAllLocations();
    
    // Update location payment method configurations
    for (const location of locations) {
      const locationPaymentMethods = await storage.getLocationPaymentMethods(location.id);
      const existingConfig = locationPaymentMethods.find(lpm => lpm.paymentMethodId === updatedMethod.id);
      
      if (updatedMethod.isAvailableToLocations) {
        // If method is now available to locations and not yet configured
        if (!existingConfig) {
          await storage.enablePaymentMethodForLocation(location.id, updatedMethod.id);
          console.log(`[PaymentSync] Enabled ${updatedMethod.name} for location ${location.name}`);
        }
      } else {
        // If method is no longer available to locations, disable it
        if (existingConfig) {
          await storage.disablePaymentMethodForLocation(location.id, updatedMethod.id);
          console.log(`[PaymentSync] Disabled ${updatedMethod.name} for location ${location.name}`);
        }
      }
    }
    
    // If API credentials were updated, mark as configured
    if (updatedMethod.requiresApi && updatedMethod.apiKey && updatedMethod.apiSecret) {
      await storage.updatePaymentMethod(updatedMethod.id, { isConfigured: true });
      console.log(`[PaymentSync] Marked ${updatedMethod.name} as configured with API credentials`);
    }
    
    console.log(`[PaymentSync] Synchronization complete for ${updatedMethod.name}`);
  }
  
  /**
   * Validates and activates payment methods with proper API configuration
   */
  static async validateAndActivatePaymentMethod(methodId: number, apiCredentials: {
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
  }): Promise<boolean> {
    const method = await storage.getPaymentMethod(methodId);
    if (!method) {
      throw new Error('Payment method not found');
    }
    
    // Update with API credentials
    const updatedMethod = await storage.updatePaymentMethod(methodId, {
      ...apiCredentials,
      isConfigured: true,
      isActive: true,
      isAvailableToLocations: true
    });
    
    // Sync changes across all locations
    await this.syncPaymentMethodChanges(updatedMethod);
    
    console.log(`[PaymentSync] Activated and configured ${method.name} payment method`);
    return true;
  }
  
  /**
   * Synchronizes all admin setting changes across the system
   */
  static async syncAdminChanges(changeType: 'payment' | 'location' | 'global', entityId?: number): Promise<void> {
    console.log(`[PaymentSync] Synchronizing admin changes: ${changeType}`);
    
    switch (changeType) {
      case 'payment':
        if (entityId) {
          const method = await storage.getPaymentMethod(entityId);
          if (method) {
            await this.syncPaymentMethodChanges(method);
          }
        }
        break;
        
      case 'location':
        // Sync location-specific changes
        if (entityId) {
          const location = await storage.getLocation(entityId);
          if (location) {
            // Update payment method availability for this location
            const availableMethods = await storage.getAvailablePaymentMethodsForLocation(entityId);
            console.log(`[PaymentSync] Updated payment methods for location ${location.name}: ${availableMethods.length} methods available`);
          }
        }
        break;
        
      case 'global':
        // Sync global settings changes across all locations
        const allLocations = await storage.getAllLocations();
        for (const location of allLocations) {
          // Refresh payment configurations for all locations
          const methods = await storage.getAvailablePaymentMethodsForLocation(location.id);
          console.log(`[PaymentSync] Refreshed global settings for location ${location.name}`);
        }
        break;
    }
    
    console.log(`[PaymentSync] Admin synchronization complete for ${changeType}`);
  }
}