from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload, name="upload"),
    path("livestream/disconnect/", views.disconnect_livestream, name="disconnect_livestream"),
    path('delete-file/', views.delete_file, name='delete_file'),
]
