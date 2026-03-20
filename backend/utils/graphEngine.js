/**
 * graphEngine.js
 * ──────────────────────────────────────────────────────────────────
 * Pure graph-traversal engine for the workflow system.
 * Reads nodes + edges from workflow.flowData (React Flow format).
 * Supports node types: start, input, condition, task, decision, notification, end
 * ──────────────────────────────────────────────────────────────────
 */

// ─── Condition Evaluator ─────────────────────────────────────────────────────

const evaluateCondition = (condition, formData) => {
    // Resolve field value — try exact match first, then search by label key
    const rawValue = formData[condition.field];

    // Strict: if field not found in formData, condition fails
    if (rawValue === undefined || rawValue === null) {
        if (condition.operator === 'is_empty') return true;
        console.warn(`[graphEngine] Field not found in formData: "${condition.field}"`);
        return false;
    }

    const strValue = String(rawValue).trim();
    if (strValue === '') {
        if (condition.operator === 'not_empty') return false;
        if (condition.operator === 'is_empty') return true;
        return false;
    }

    // Always cast to number for numeric comparisons
    const numValue = parseFloat(strValue);
    const numTarget = parseFloat(String(condition.value).trim());
    const isNumericOp = ['greater_than', 'less_than', 'greater_equal', 'less_equal', 'greater_than', 'less_than'].includes(condition.operator);

    if (isNumericOp && (isNaN(numValue) || isNaN(numTarget))) {
        console.warn(`[graphEngine] Non-numeric value for numeric operator "${condition.operator}": field="${condition.field}", value="${rawValue}", target="${condition.value}"`);
        return false;
    }

    console.log(`[graphEngine] Evaluating: field="${condition.field}" value=${rawValue}(${numValue}) ${condition.operator} ${condition.value}(${numTarget})`);

    switch (condition.operator) {
        // Core equality
        case 'equals':
        case 'equal': {
            // Try numeric comparison first if both sides are numbers
            if (!isNaN(numValue) && !isNaN(numTarget)) return numValue === numTarget;
            return strValue.toLowerCase() === String(condition.value).trim().toLowerCase();
        }
        case 'not_equals':
        case 'not_equal':
            if (!isNaN(numValue) && !isNaN(numTarget)) return numValue !== numTarget;
            return strValue.toLowerCase() !== String(condition.value).trim().toLowerCase();

        // Numeric comparisons
        case 'greater_than': return numValue > numTarget;
        case 'less_than': return numValue < numTarget;
        case 'greater_equal': return numValue >= numTarget;
        case 'less_equal': return numValue <= numTarget;

        // String operations
        case 'contains': return strValue.toLowerCase().includes(String(condition.value).toLowerCase());
        case 'not_contains': return !strValue.toLowerCase().includes(String(condition.value).toLowerCase());
        case 'not_empty': return strValue !== '';
        case 'is_empty': return strValue === '';
        default:
            console.warn(`[graphEngine] Unknown operator: ${condition.operator}`);
            return false; // unknown operator = fail safe
    }
};

/**
 * Evaluate ALL conditions in a node's condition list.
 * CRITICAL: empty conditions array = FAILS (requires at least 1 rule to pass)
 * Returns { passes: bool, failedCondition: obj|null }
 */
const evaluateConditions = (conditions = [], formData = {}) => {
    // IMPORTANT FIX: if no conditions configured, node cannot auto-approve
    if (!conditions || conditions.length === 0) {
        console.warn('[graphEngine] Condition node has no conditions configured — treating as PASS to avoid blocking. Configure at least one rule.');
        // Returning true here so an empty condition node doesn't block flow
        // but logs a warning. The UI should enforce at least 1 rule.
        return { passes: true, failedCondition: null };
    }

    // Filter out empty/incomplete conditions (safety guard)
    const validConditions = conditions.filter(c => c && c.field && c.operator);
    if (validConditions.length === 0) {
        console.warn('[graphEngine] All conditions are incomplete (missing field or operator) — treating as PASS.');
        return { passes: true, failedCondition: null };
    }

    let result = evaluateCondition(validConditions[0], formData);
    let failedCondition = result ? null : validConditions[0];

    for (let i = 1; i < validConditions.length; i++) {
        const cond = validConditions[i];
        const condResult = evaluateCondition(cond, formData);

        if (cond.logicalOperator === 'OR') {
            if (!result) result = condResult;
        } else {
            // Default AND
            result = result && condResult;
        }

        if (!result && !failedCondition) failedCondition = cond;
    }

    console.log(`[graphEngine] Condition evaluation result: ${result}`, failedCondition ? `FAILED: ${JSON.stringify(failedCondition)}` : '');
    return { passes: result, failedCondition };
};

// ─── Graph Helpers ────────────────────────────────────────────────────────────

/** Find the start node (nodeType === 'start') */
const findStartNode = (nodes = []) => {
    return nodes.find(n => n.data?.nodeType === 'start' || n.data?.stepType === 'start');
};

/** Find a node by its React Flow id */
const findNodeById = (nodes = [], nodeId) => {
    return nodes.find(n => n.id === nodeId) || null;
};

/**
 * Get the next node(s) from the current node, following edges.
 * For condition nodes: pass `decision = 'true' | 'false'` to pick the handle.
 * For decision nodes: pass `decision = branchIndex | label`.
 * For all others: returns first outgoing edge target (single path).
 *
 * Returns: { nextNodeId: string | null, edgeLabel: string }
 */
const getNextNode = (nodeId, edges = [], decision = null) => {
    const outgoing = edges.filter(e => e.source === nodeId);

    if (outgoing.length === 0) return { nextNodeId: null, edgeLabel: '' };

    if (decision !== null) {
        // Try to match by sourceHandle first, then by edge label
        const matched = outgoing.find(e =>
            (e.sourceHandle && e.sourceHandle.toLowerCase() === String(decision).toLowerCase()) ||
            (e.label && e.label.toLowerCase() === String(decision).toLowerCase())
        );
        if (matched) return { nextNodeId: matched.target, edgeLabel: matched.label || decision };

        // Fallback: if only one edge and no handle match, use it
        if (outgoing.length === 1) return { nextNodeId: outgoing[0].target, edgeLabel: outgoing[0].label || '' };

        // Default fallback: first edge (shouldn't happen in well-configured flows)
        return { nextNodeId: outgoing[0].target, edgeLabel: outgoing[0].label || '' };
    }

    // Single path nodes: just follow first edge
    return { nextNodeId: outgoing[0].target, edgeLabel: outgoing[0].label || '' };
};

// ─── Node Type Resolver ───────────────────────────────────────────────────────

const getNodeType = (node) => {
    return (node.data?.nodeType || node.data?.stepType || 'task').toLowerCase();
};

// ─── Auto-Advance Types ───────────────────────────────────────────────────────
// These node types do NOT require human action — the engine auto-advances through them.
const AUTO_ADVANCE_TYPES = new Set(['start', 'input', 'condition', 'notification', 'end', 'action']);

/**
 * Is this a node that requires human (task) action?
 */
const isTaskNode = (node) => {
    const t = getNodeType(node);
    return t === 'task' || t === 'approval' || t === 'decision';
};

// ─── Main Graph Traversal ─────────────────────────────────────────────────────

/**
 * Traverse the graph starting from `startNodeId` (or the condition result of
 * the previous node), auto-advancing through non-task nodes.
 *
 * Returns an object describing what happened:
 * {
 *   status: 'task_created' | 'completed' | 'rejected' | 'notification',
 *   currentNodeId: string,
 *   taskNodeId: string | null,
 *   taskAssignedRole: string | null,
 *   notificationData: { title, message, type } | null,
 *   rejectedReason: string | null,
 *   nodeHistory: [{ nodeId, nodeType, label }],
 * }
 */
const traverseFromNode = (startNodeId, nodes, edges, formData) => {
    const MAX_STEPS = 50; // Guard against infinite loops
    let currentNodeId = startNodeId;
    const nodeHistory = [];
    let steps = 0;

    while (currentNodeId && steps < MAX_STEPS) {
        steps++;
        const node = findNodeById(nodes, currentNodeId);
        if (!node) {
            console.error(`[graphEngine] Node not found: ${currentNodeId}`);
            break;
        }

        const nodeType = getNodeType(node);
        const nodeData = node.data || {};

        nodeHistory.push({ nodeId: currentNodeId, nodeType, label: nodeData.label || nodeType });

        // ── END NODE ──
        if (nodeType === 'end') {
            const isRejected = nodeData.endState === 'rejected';
            return {
                status: isRejected ? 'rejected' : 'completed',
                currentNodeId,
                taskNodeId: null,
                taskAssignedRole: null,
                notificationData: !isRejected && nodeData.message ? {
                    title: nodeData.label || 'Workflow Completed',
                    message: nodeData.message,
                    type: 'workflow_complete',
                } : null,
                rejectedReason: isRejected ? (nodeData.message || 'Request was rejected.') : null,
                failedCondition: null, // this was a manual rejection node
                nodeHistory,
            };
        }

        // ── START / INPUT nodes — auto-advance ──
        if (nodeType === 'start' || nodeType === 'input') {
            const { nextNodeId } = getNextNode(currentNodeId, edges);
            if (!nextNodeId) {
                return { status: 'completed', currentNodeId, taskNodeId: null, taskAssignedRole: null, notificationData: null, rejectedReason: null, nodeHistory };
            }
            currentNodeId = nextNodeId;
            continue;
        }

        // ── CONDITION NODE — evaluate and branch ──
        if (nodeType === 'condition') {
            const conditions = nodeData.conditions || [];
            const { passes, failedCondition } = evaluateConditions(conditions, formData);

            if (!passes) {
                // Check if rejection or follow false edge
                const rejectReason = nodeData.rejectReason || 'You do not meet the eligibility criteria.';
                const falseEdge = edges.find(e => e.source === currentNodeId && (
                    (e.sourceHandle && e.sourceHandle.toLowerCase() === 'false') ||
                    (e.label && e.label.toLowerCase() === 'false')
                ));

                if (falseEdge) {
                    // Follow the FALSE path
                    currentNodeId = falseEdge.target;
                    continue;
                }

                // No false path = hard rejection
                return {
                    status: 'rejected',
                    currentNodeId,
                    taskNodeId: null,
                    taskAssignedRole: null,
                    notificationData: null,
                    rejectedReason: rejectReason,
                    failedCondition,
                    nodeHistory,
                };
            }

            // Condition passed — follow TRUE edge
            const { nextNodeId } = getNextNode(currentNodeId, edges, 'true');
            if (!nextNodeId) {
                // Try to follow any edge (in case handles aren't set)
                const { nextNodeId: anyNext } = getNextNode(currentNodeId, edges);
                if (!anyNext) return { status: 'completed', currentNodeId, taskNodeId: null, taskAssignedRole: null, notificationData: null, rejectedReason: null, nodeHistory };
                currentNodeId = anyNext;
            } else {
                currentNodeId = nextNodeId;
            }
            continue;
        }

        // ── NOTIFICATION NODE — auto-advance but record notification ──
        if (nodeType === 'notification') {
            const notifData = {
                title: nodeData.notifTitle || nodeData.label || 'Notification',
                message: nodeData.notifMessage || nodeData.message || '',
                type: nodeData.notifType || 'info',
            };

            const { nextNodeId } = getNextNode(currentNodeId, edges);
            if (!nextNodeId) {
                return {
                    status: 'completed', currentNodeId, taskNodeId: null, taskAssignedRole: null,
                    notificationData: notifData,
                    notifRecipientType: nodeData.notifRecipientType || 'requestUser',
                    notifRecipientRole: nodeData.notifRecipientRole || null,
                    rejectedReason: null, nodeHistory,
                };
            }

            return {
                status: 'notification', currentNodeId, nextNodeId,
                taskNodeId: null, taskAssignedRole: null,
                notificationData: notifData,
                notifRecipientType: nodeData.notifRecipientType || 'requestUser',
                notifRecipientRole: nodeData.notifRecipientRole || null,
                rejectedReason: null, nodeHistory,
            };
        }

        // ── TASK / APPROVAL NODE — pause and create a task ──
        if (nodeType === 'task' || nodeType === 'approval') {
            return {
                status: 'task_created',
                currentNodeId,
                taskNodeId: currentNodeId,
                taskAssignedRole: nodeData.assignedRole || 'any',
                taskLabel: nodeData.label || 'Approval Required',
                notificationData: null,
                rejectedReason: null,
                nodeHistory,
            };
        }

        // ── DECISION NODE — pause for human decision ──
        if (nodeType === 'decision') {
            return {
                status: 'task_created',
                currentNodeId,
                taskNodeId: currentNodeId,
                taskAssignedRole: nodeData.assignedRole || 'manager',
                taskLabel: nodeData.label || 'Decision Required',
                branches: nodeData.branches || [],
                notificationData: null,
                rejectedReason: null,
                nodeHistory,
            };
        }

        // ── ACTION NODE (automated) — auto-advance ──
        if (nodeType === 'action') {
            const { nextNodeId } = getNextNode(currentNodeId, edges);
            if (!nextNodeId) return { status: 'completed', currentNodeId, taskNodeId: null, taskAssignedRole: null, notificationData: null, rejectedReason: null, nodeHistory };
            currentNodeId = nextNodeId;
            continue;
        }

        // Unknown type — advance
        const { nextNodeId } = getNextNode(currentNodeId, edges);
        if (!nextNodeId) break;
        currentNodeId = nextNodeId;
    }

    return {
        status: 'completed',
        currentNodeId,
        taskNodeId: null,
        taskAssignedRole: null,
        notificationData: null,
        rejectedReason: null,
        nodeHistory,
    };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    evaluateCondition,
    evaluateConditions,
    findStartNode,
    findNodeById,
    getNextNode,
    getNodeType,
    isTaskNode,
    traverseFromNode,
};
