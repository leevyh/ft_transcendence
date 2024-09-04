from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, User
from asgiref.sync import async_to_sync, sync_to_async
from channels.layers import get_channel_layer

class User_site(AbstractUser):
    class Status(models.TextChoices):
        ONLINE = "online"
        OFFLINE = "offline"
        INGAME = "ingame"

    nickname = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=255, default=Status.OFFLINE, choices=Status.choices)
    avatar = models.ImageField(upload_to='avatar/', default='default.jpg')

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        super(User_site, self).save(*args, **kwargs)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "status_updates",
            {
                "type": "send_status_update",
                "message": {
                    "user_id": self.id,  # Ajoutez l'ID de l'utilisateur
                    "nickname": self.nickname,
                    "status": self.status,
                },
            },
        )

class Accessibility(models.Model):
    class Language(models.TextChoices):
        FRENCH = "fr"
        ENGLISH = "en"
        SPANISH = "sp"
    user = models.OneToOneField(User_site, on_delete=models.CASCADE, primary_key=True)
    language = models.CharField(max_length=255, default=Language.ENGLISH, choices=Language.choices)
    font_size = models.IntegerField(default=2, choices=[(1, 'Small'), (2, 'Medium'), (3, 'Large')])
    dark_mode = models.BooleanField(default=False)


class Stats_user(models.Model):
    user = models.OneToOneField(User_site, on_delete=models.CASCADE, primary_key=True)
    nb_games = models.IntegerField(default=0)
    nb_wins = models.IntegerField(default=0)
    nb_losses = models.IntegerField(default=0)
    nb_point_taken = models.IntegerField(default=0)
    nb_point_given = models.IntegerField(default=0)
    win_rate = models.FloatField(default=0.0)

class Friend_Request(models.Model):
    user = models.ForeignKey(User_site, on_delete=models.CASCADE, related_name="user")
    friend = models.ForeignKey(User_site, on_delete=models.CASCADE, related_name="friend")
    created_at = models.DateTimeField(default=timezone.now)
    accepted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        super(Friend_Request, self).save(*args, **kwargs)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "friend_requests",
            {
                "type": "send_friend_request",
                "message": {
                    "user_id": self.user.id,
                    "friend_id": self.friend.id,
                    "nickname": self.user.nickname,
                },
            },
        )





























# class User_site(models.Model):
#     ONLINE = "green"
#     OFFLINE = "gray"
#     INGAME = "yellow"
#     STATUS = {
#         ONLINE: "Online",
#         OFFLINE: "Offline",
#         INGAME: "In-Game",
#     }
#     email  = models.EmailField(max_length=255, unique=True)
#     login = models.CharField(max_length=255, unique=True)
#     password = models.CharField(max_length=128)
#     nickname = models.CharField(max_length=255)
#     status = models.CharField(max_length=255, default=OFFLINE, choices=STATUS) #check si ca marche
#     created_at = models.DateTimeField(default=timezone.now)


    # ONLINE = "green"
    # OFFLINE = "gray"
    # INGAME = "yellow"
    # STATUS = {
    #     ONLINE: "Online",
    #     OFFLINE: "Offline",
    #     INGAME: "In-Game",
    # }
    # email  = models.EmailField(max_length=255, unique=True)
    # login = models.CharField(max_length=255, unique=True)
    # password = models.CharField(max_length=128)
    # nickname = models.CharField(max_length=255)
    # status = models.CharField(max_length=255, default=OFFLINE, choices=STATUS) #check si ca marche
    # created_at = models.DateTimeField(default=timezone.now)





