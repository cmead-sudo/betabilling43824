import { useState } from "react";
import { FileText, User, Clock, ArrowRight, Shield, Filter } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  reason: string | null;
  electronic_signature: string | null;
  created_at: string;
}

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  isLoading?: boolean;
}

/**
 * Human-Readable Audit Log Viewer
 * 
 * Translates JSON audit data into plain English sentences
 * per FDA 21 CFR Part 11 "human readable form" requirement.
 */
export const AuditLogViewer = ({ logs, isLoading }: AuditLogViewerProps) => {
  const [filter, setFilter] = useState<string>("all");

  // Format a value for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "empty";
    if (typeof value === "number") {
      // Check if it looks like currency
      if (value >= 100) {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string") {
      // Format dates if they look like ISO strings
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return format(new Date(value), "MMM d, yyyy 'at' h:mm a");
        } catch {
          return value;
        }
      }
      return value;
    }
    return JSON.stringify(value);
  };

  // Convert a field name to human-readable label
  const humanizeFieldName = (field: string): string => {
    return field
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Generate human-readable description of what changed
  const describeChange = (log: AuditLogEntry): string => {
    const userName = log.user_email?.split("@")[0] || "System";
    const timestamp = format(new Date(log.created_at), "MMMM d, yyyy 'at' h:mm a");
    const tableName = humanizeFieldName(log.table_name);

    switch (log.action) {
      case "INSERT":
        return `${userName} created a new ${tableName} record on ${timestamp}`;
      
      case "DELETE":
        return `${userName} removed a ${tableName} record on ${timestamp}`;
      
      case "UPDATE": {
        if (!log.changed_fields || log.changed_fields.length === 0) {
          return `${userName} updated a ${tableName} record on ${timestamp}`;
        }
        const changes = log.changed_fields.map(field => {
          const oldVal = log.old_values?.[field];
          const newVal = log.new_values?.[field];
          return `${humanizeFieldName(field)} from "${formatValue(oldVal)}" to "${formatValue(newVal)}"`;
        });
        return `${userName} changed ${changes.join(", ")} on ${timestamp}`;
      }
      
      case "EXPORT":
        return `${userName} exported data on ${timestamp}`;
      
      case "APPROVE":
        return `${userName} approved a ${tableName} record on ${timestamp}`;
      
      case "REJECT":
        return `${userName} rejected a ${tableName} record on ${timestamp}`;
      
      case "LOGIN":
        return `${userName} logged in on ${timestamp}`;
      
      case "LOGOUT":
        return `${userName} logged out on ${timestamp}`;
      
      case "VIEW":
        return `${userName} viewed a ${tableName} record on ${timestamp}`;
      
      default:
        return `${userName} performed ${log.action} on ${tableName} at ${timestamp}`;
    }
  };

  // Get action badge color
  const getActionColor = (action: string): string => {
    switch (action) {
      case "INSERT": return "bg-status-active/10 text-status-active";
      case "UPDATE": return "bg-primary/10 text-primary";
      case "DELETE": return "bg-destructive/10 text-destructive";
      case "APPROVE": return "bg-status-active/10 text-status-active";
      case "REJECT": return "bg-destructive/10 text-destructive";
      case "EXPORT": return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.action === filter);

  const actionTypes = [...new Set(logs.map(l => l.action))];

  if (isLoading) {
    return (
      <div className="soft-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="soft-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Audit Trail</h3>
            <p className="text-sm text-muted-foreground">21 CFR Part 11 Compliant Records</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-semibold text-foreground">No audit records found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Changes to records will appear here
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
            >
              {/* Human Readable Description */}
              <p className="font-medium text-foreground mb-3">
                {describeChange(log)}
              </p>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* Action Badge */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                  {log.action}
                </span>

                {/* User */}
                {log.user_email && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    {log.user_email}
                  </span>
                )}

                {/* Timestamp */}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(log.created_at), "MMM d, yyyy h:mm:ss a")}
                </span>

                {/* Electronic Signature Indicator */}
                {log.electronic_signature && (
                  <span className="flex items-center gap-1 text-status-active">
                    <Shield className="w-3.5 h-3.5" />
                    Signed
                  </span>
                )}
              </div>

              {/* Detailed Changes (for UPDATE) */}
              {log.action === "UPDATE" && log.changed_fields && log.changed_fields.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Changes:</p>
                  <div className="space-y-1">
                    {log.changed_fields.map((field) => (
                      <div key={field} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{humanizeFieldName(field)}:</span>
                        <span className="text-destructive/70 line-through">
                          {formatValue(log.old_values?.[field])}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-status-active font-medium">
                          {formatValue(log.new_values?.[field])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason (if provided) */}
              {log.reason && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reason:</p>
                  <p className="text-sm text-foreground">{log.reason}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
