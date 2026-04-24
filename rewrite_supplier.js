const fs = require('fs');

const T = {
  bg:'#f8fafc', 
  surface:'#ffffff', 
  surface2:'#f1f5f9', 
  border:'#e2e8f0',
  accent:'#4f46e5', 
  accentLt:'#eef2ff',
  success:'#10b981', 
  successLt:'#dcfce7', 
  textSuccess:'#166534',
  danger:'#ef4444', 
  dangerLt:'#fee2e2', 
  textDanger:'#991b1b',
  warn:'#f59e0b', 
  warnLt:'#fef3c7', 
  textWarn:'#92400e',
  ink:'#0f172a', 
  txt2:'#475569', 
  txt3:'#94a3b8',
  shadow:'0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.02)',
  shadowMd:'0 10px 25px -5px rgba(0,0,0,0.08)',
  radius:'16px', 
  radiusLg:'24px',
};

const newJSX = `
  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ background: '#ffffff', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(79,70,229,0.1)', border: '2px solid rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#4f46e5', overflow: 'hidden' }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{profile?.full_name || user?.email || 'Supplier Profile'}</h1>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ID: {user?.id.substring(0,8).toUpperCase()}</div>
            </div>
          </div>
          <button onClick={() => signOutConfirm ? signOut() : setSignOutConfirm(true)}
            style={{ padding: '8px', background: signOutConfirm ? '#fee2e2' : '#f1f5f9', color: signOutConfirm ? '#ef4444' : '#64748b', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            <LogOut size={16} />
          </button>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', gap: '20px' }}>
          {(['overview', 'customers'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '14px 0', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent', color: activeTab === tab ? '#4f46e5' : '#64748b', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {tab === 'overview' ? <User size={14} /> : <Users size={14} />}
              {tab === 'overview' ? 'Overview' : \`Customers (\${myCustomers.length})\`}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          <AnimatePresence mode="wait">

            {/* ══════════════ OVERVIEW TAB ══════════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                
                {/* Compact Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'Sent', val: fmt(totalDispatched).replace('₦',''), icon: TrendingUp, color: '#4f46e5', bg: '#eef2ff' },
                    { label: 'Wait', val: String(pendingCount), icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
                    { label: 'Done', val: String(completedCount), icon: Package, color: '#10b981', bg: '#dcfce7' },
                    { label: 'Cust', val: String(myCustomers.length), icon: Users, color: '#ec4899', bg: '#fce7f3' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#ffffff', borderRadius: '14px', padding: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={16} color={s.color} style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Debt Card - Compact */}
                <div style={{ background: hasDebt ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#10b981,#047857)', borderRadius: '16px', padding: '16px', marginBottom: '20px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginBottom: '4px' }}>Debt Balance</div>
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{fmt(myAccount?.debtBalance || 0)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                    {hasDebt ? <AlertTriangle size={20} color="#fff" /> : <Check size={20} color="#fff" />}
                  </div>
                </div>

                {/* Profile Card */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="#4f46e5" /> Personal Details
                    </div>
                    {!editing && (
                      <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </div>

                  <div style={{ padding: '16px' }}>
                    {editing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#f1f5f9', border: '2px solid rgba(79,70,229,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900, color: '#4f46e5' }}>
                              {editImage ? <img src={editImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '24px', height: '24px', borderRadius: '8px', background: '#4f46e5', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Camera size={12} />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                          </div>
                        </div>

                        {[
                          { label: 'Full Name', val: editName, set: setEditName, type: 'text', ph: 'Name' },
                          { label: 'Username', val: editUsername, set: setEditUsername, type: 'text', ph: 'Username' },
                          { label: 'Phone', val: editPhone, set: setEditPhone, type: 'tel', ph: 'Phone' },
                          { label: 'Bank', val: editBankName, set: setEditBankName, type: 'text', ph: 'Bank' },
                          { label: 'Account No', val: editAcctNo, set: setEditAcctNo, type: 'tel', ph: 'Account No' },
                          { label: 'WhatsApp', val: editWhatsapp, set: setEditWhatsapp, type: 'tel', ph: 'WhatsApp' },
                        ].map(f => (
                          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ width: '70px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{f.label}</label>
                            <input type={f.type} value={f.val} placeholder={f.ph} onChange={e => f.set(e.target.value)}
                              style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a', outline: 'none' }} />
                          </div>
                        ))}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button onClick={handleCancelEdit} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                          <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 2, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { icon: Mail, label: 'Email', val: user?.email },
                          { icon: Phone, label: 'Phone', val: profile?.phone || 'Not set' },
                          { icon: MessageSquare, label: 'WhatsApp', val: profile?.whatsapp_number || 'Not set' },
                          { icon: AtSign, label: 'Username', val: profile?.username ? '@' + profile.username : 'Not set' },
                          { icon: Landmark, label: 'Bank Details', val: profile?.bank_name ? \`\${profile.bank_name} • \${profile.account_number}\` : 'Not set' },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                              <item.icon size={14} />
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8' }}>{item.label}</div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.val}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ══════════════ CUSTOMERS TAB ══════════════ */}
            {activeTab === 'customers' && (
              <motion.div key="customers" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {myCustomers.length === 0 ? (
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <Users size={40} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No Customers Yet</div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      You haven't been assigned any customers. Store Keepers will link customers to you.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {myCustomers.map((c, i) => {
                      const hasDebtBalance = (c.debtBalance || 0) > 0;
                      return (
                        <div key={c.id} style={{ padding: '12px 16px', borderBottom: i < myCustomers.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: hasDebtBalance ? '#fee2e2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: hasDebtBalance ? '#ef4444' : '#475569' }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                            {c.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>{c.phone}</div>}
                          </div>
                          {hasDebtBalance && (
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444' }}>{fmt(c.debtBalance || 0)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
      <ImageCropModal isOpen={showCropper} imageSrc={cropSrc} onClose={() => setShowCropper(false)} onCropCompleteAction={handleCropComplete} />
    </AnimatedPage>
  );
};
`;

let content = fs.readFileSync('c:/bread/src/pages/SupplierProfile.tsx', 'utf8');

// The tricky part: we need to replace everything from "return (" down to the end of the component.
// We know "const avatarUrl = profile?.avatar_url;" is right before the return.

const parts = content.split(/return\s*\(\s*<AnimatedPage>/);

if (parts.length === 2) {
  // Fix imports missing AtSign
  let topPart = parts[0];
  if (!topPart.includes('AtSign')) {
    topPart = topPart.replace('AlertTriangle,', 'AlertTriangle, AtSign,');
  }

  const finalContent = topPart + newJSX;
  fs.writeFileSync('c:/bread/src/pages/SupplierProfile.tsx', finalContent);
  console.log("Successfully updated the SupplierProfile component to be compact and manager-style!");
} else {
  console.error("Could not find the return boundary. Found " + parts.length + " parts.");
}
