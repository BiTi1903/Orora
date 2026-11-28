export function audienceRule(segment = 'all', productId = '') {
  if (!['all','buyers','nonbuyers','product'].includes(segment) ||
      (segment === 'product' && !/^[\w-]{1,150}$/.test(productId))) {
    throw new Error('invalid_audience');
  }
  return {segment,productId:segment === 'product' ? productId : ''};
}

// The campaign already pages contacts in groups of twenty. Look up only their orders.
export async function eligibleContacts(db, docs, rule) {
  const active = docs.filter(doc => doc.data()?.status === 'active');
  if (!active.length || rule.segment === 'all') return active;
  const emails = active.map(doc => doc.data().email);
  const orders = await db.collection('orders').where('customer.email','in',emails)
    .select('customer.email','status','product.id','items').get();
  const buyers = new Set();
  for (const doc of orders.docs) {
    const order = doc.data();
    if (order.status === 'cancelled') continue;
    if (rule.segment === 'product' && order.product?.id !== rule.productId &&
        !order.items?.some(item => item.id === rule.productId)) continue;
    buyers.add(order.customer.email);
  }
  return active.filter(doc => buyers.has(doc.data().email) === (rule.segment !== 'nonbuyers'));
}

export async function audienceCount(db, contacts, rule) {
  if (rule.segment === 'all') return (await contacts.where('status','==','active').count().get()).data().count;
  let count = 0, cursor;
  do {
    let query = contacts.where('status','==','active').orderBy('__name__').limit(20);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    count += (await eligibleContacts(db,page.docs,rule)).length;
    cursor = page.docs.length === 20 ? page.docs.at(-1) : null;
  } while (cursor);
  return count;
}
