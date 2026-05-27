"""Notifications routes"""
from fastapi import APIRouter, Depends
from models.user import User
from models.notification import Notification
from api.routes.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifs = await Notification.find(
        Notification.user_id == str(current_user.id)
    ).sort(-Notification.created_at).limit(50).to_list()
    unread = sum(1 for n in notifs if not n.is_read)
    return {"notifications": [n.model_dump() for n in notifs], "unread_count": unread}


@router.post("/{notif_id}/read")
async def mark_read(notif_id: str, current_user: User = Depends(get_current_user)):
    notif = await Notification.get(notif_id)
    if notif and notif.user_id == str(current_user.id):
        notif.is_read = True
        await notif.save()
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False,
    ).update({"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}
