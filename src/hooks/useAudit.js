import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useAudit() {
  const log = async (adminId, action, targetUserId, metadata) => {
    await supabase.from('admin_audit').insert({
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      metadata: metadata || null,
    })
  }
  return { log }
}
