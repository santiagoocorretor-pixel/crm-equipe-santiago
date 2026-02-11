import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, refetch } = trpc.notifications.list.useQuery({ unreadOnly: false });
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();

  const handleMarkAsRead = async (id: number) => {
    await markAsReadMutation.mutateAsync({ id });
    refetch();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
    refetch();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "lead_moved":
        return "📍";
      case "task_due":
        return "⏰";
      case "new_interaction":
        return "💬";
      case "lead_created":
        return "👤";
      case "cadence_started":
        return "🔄";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "lead_moved":
        return "bg-blue-50 border-blue-200";
      case "task_due":
        return "bg-red-50 border-red-200";
      case "new_interaction":
        return "bg-green-50 border-green-200";
      case "lead_created":
        return "bg-purple-50 border-purple-200";
      case "cadence_started":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell size={20} />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount && unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`m-2 p-3 border cursor-pointer hover:shadow-md transition ${
                    notification.isRead ? "opacity-60" : "border-l-4 border-l-blue-500"
                  } ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-xl mt-1">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                        {notification.message && (
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
