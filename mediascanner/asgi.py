import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import livestream.routing  # <- your app's routing.py

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mediascanner.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            livestream.routing.websocket_urlpatterns
        )
    ),
})
