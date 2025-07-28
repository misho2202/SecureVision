from django.urls import re_path
from .consumers import LivestreamConsumer

websocket_urlpatterns = [
    re_path(r"ws/livestream/$", LivestreamConsumer.as_asgi()),
]
