// src/types/contract.types.ts

/**
 * The interface describing all methods on your CentralLinkOfTrustContract.
 * 
 * `viewMethods` do not alter state; `changeMethods` do.
 */
export interface CentralLinkOfTrustContract {
    //---------------------
    // View Methods (read-only)
    //---------------------
    view_public_profile: (params: { user_id: string }) => Promise<string | null>;
    // Add more view methods as needed...
    // e.g. isUserBlocked, etc.
  
    //---------------------
    // Change Methods (modify state)
    //---------------------
    modify_public_profile: (params: { profile: string }) => Promise<void>;
    set_trust_request_cost: (params: { cost: string }) => Promise<void>;
    // If you have deposit-based calls:
    //   request_trust: (params: { callee_id: string, expiry_offset: number }) => Promise<void>;
  
    // Add all other contract methods as needed...
  }
  