from django.urls import path
from . import views

urlpatterns = [
    # path('', views.index, name='index'),
    path("upload/", views.upload, name="upload"),
    # path("upload/", views.upload_and_process, name="upload"),
    # path("livestream/", views.livestream_view, name="livestream"),
    # path("livestream/", views.livestream_feed, name="livestream"),
    path("livestream/disconnect/", views.disconnect_livestream, name="disconnect_livestream"),
    # path('uploaded-images/', views.uploaded_images, name='uploaded_images'),
    # path('delete-image/', views.delete_image, name='delete_image'),  # single
    # path('delete-all-images/', views.delete_all_images, name='delete_all'),  # all
]