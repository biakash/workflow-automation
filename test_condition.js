const { traverseFromNode } = require('./backend/utils/graphEngine');
const nodes = [
  { id: '1', data: { nodeType: 'start' } },
  { id: '2', data: { nodeType: 'condition', conditions: [{ field: 'age', operator: 'greater_equal', value: '20' }] } },
  { id: '3', data: { nodeType: 'task', label: 'Loan Approved' } }
];
const edges = [
  { source: '1', target: '2' },
  { source: '2', target: '3' }
];

console.log('--- AGE: 18 ---');
const res1 = traverseFromNode('1', nodes, edges, { age: '18' });
console.log(JSON.stringify(res1, null, 2));

console.log('--- AGE: 22 ---');
const res2 = traverseFromNode('1', nodes, edges, { age: '22' });
console.log(JSON.stringify(res2, null, 2));
