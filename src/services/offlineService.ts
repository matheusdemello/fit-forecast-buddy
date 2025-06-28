import { supabase, isOnline, generateUUID } from '../lib/supabase';

interface OfflineOperation {
  id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  data: any;
  created_at: string;
  synced_at?: string;
  error_message?: string;
}

const OFFLINE_QUEUE_KEY = 'offline_operations_queue';

export class OfflineService {
  /**
   * Add operation to offline queue
   */
  static async addToOfflineQueue(
    operationType: 'INSERT' | 'UPDATE' | 'DELETE',
    tableName: string,
    data: any
  ): Promise<void> {
    try {
      const operation: OfflineOperation = {
        id: generateUUID(),
        operation_type: operationType,
        table_name: tableName,
        data,
        created_at: new Date().toISOString()
      };

      // Add to local queue
      const queue = this.getOfflineQueue();
      queue.push(operation);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

      console.log(`Added ${operationType} operation for ${tableName} to offline queue`);
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  /**
   * Get offline operations queue
   */
  static getOfflineQueue(): OfflineOperation[] {
    try {
      const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Sync offline operations with Supabase
   */
  static async syncOfflineOperations(): Promise<{ success: number; errors: number }> {
    if (!isOnline()) {
      console.log('Still offline, skipping sync');
      return { success: 0, errors: 0 };
    }

    const queue = this.getOfflineQueue();
    if (queue.length === 0) {
      console.log('No offline operations to sync');
      return { success: 0, errors: 0 };
    }

    console.log(`Syncing ${queue.length} offline operations...`);

    let successCount = 0;
    let errorCount = 0;
    const syncedOperations: string[] = [];

    for (const operation of queue) {
      try {
        const success = await this.executeOperation(operation);
        
        if (success) {
          successCount++;
          syncedOperations.push(operation.id);
          
          // Also store in Supabase sync queue for tracking
          await supabase.from('sync_queue').insert({
            operation_type: operation.operation_type,
            table_name: operation.table_name,
            data: operation.data,
            synced_at: new Date().toISOString()
          });
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error syncing operation ${operation.id}:`, error);
        errorCount++;
        
        // Store error in Supabase for debugging
        try {
          await supabase.from('sync_queue').insert({
            operation_type: operation.operation_type,
            table_name: operation.table_name,
            data: operation.data,
            error_message: error instanceof Error ? error.message : String(error)
          });
        } catch (storeError) {
          console.error('Error storing sync error:', storeError);
        }
      }
    }

    // Remove successfully synced operations from queue
    const remainingQueue = queue.filter(op => !syncedOperations.includes(op.id));
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));

    console.log(`Sync complete: ${successCount} success, ${errorCount} errors`);
    return { success: successCount, errors: errorCount };
  }

  /**
   * Execute a single offline operation
   */
  private static async executeOperation(operation: OfflineOperation): Promise<boolean> {
    try {
      const { operation_type, table_name, data } = operation;

      switch (operation_type) {
        case 'INSERT':
          const { error: insertError } = await supabase
            .from(table_name as any)
            .insert(data);
          
          if (insertError) {
            console.error(`Insert error for ${table_name}:`, insertError);
            return false;
          }
          break;

        case 'UPDATE':
          const { id, ...updateData } = data;
          const { error: updateError } = await supabase
            .from(table_name as any)
            .update(updateData)
            .eq('id', id);
          
          if (updateError) {
            console.error(`Update error for ${table_name}:`, updateError);
            return false;
          }
          break;

        case 'DELETE':
          const { error: deleteError } = await supabase
            .from(table_name as any)
            .delete()
            .eq('id', data.id);
          
          if (deleteError) {
            console.error(`Delete error for ${table_name}:`, deleteError);
            return false;
          }
          break;

        default:
          console.error(`Unknown operation type: ${operation_type}`);
          return false;
      }

      return true;
    } catch (error) {
      console.error(`Error executing ${operation.operation_type} on ${operation.table_name}:`, error);
      return false;
    }
  }

  /**
   * Clear all offline operations (use with caution)
   */
  static clearOfflineQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('Offline queue cleared');
  }

  /**
   * Get sync status
   */
  static getSyncStatus(): { pendingOperations: number; lastSyncAttempt?: string } {
    const queue = this.getOfflineQueue();
    const lastSyncAttempt = localStorage.getItem('last_sync_attempt');
    
    return {
      pendingOperations: queue.length,
      lastSyncAttempt: lastSyncAttempt || undefined
    };
  }

  /**
   * Set up automatic sync when coming back online
   */
  static setupAutoSync(): void {
    let wasOffline = !navigator.onLine;

    const checkOnlineStatus = async () => {
      const isCurrentlyOnline = navigator.onLine;
      
      if (!wasOffline && !isCurrentlyOnline) {
        // Just went offline
        console.log('Device went offline');
        wasOffline = true;
      } else if (wasOffline && isCurrentlyOnline) {
        // Just came back online
        console.log('Device came back online, attempting sync...');
        wasOffline = false;
        
        // Wait a bit for connection to stabilize
        setTimeout(async () => {
          localStorage.setItem('last_sync_attempt', new Date().toISOString());
          await this.syncOfflineOperations();
        }, 2000);
      }
    };

    // Listen to online/offline events
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // Also check periodically
    setInterval(checkOnlineStatus, 30000); // Check every 30 seconds
  }
}

// Export convenience function
export const addToOfflineQueue = OfflineService.addToOfflineQueue.bind(OfflineService);
export const syncOfflineOperations = OfflineService.syncOfflineOperations.bind(OfflineService);
export const setupAutoSync = OfflineService.setupAutoSync.bind(OfflineService); 