from django.apps import AppConfig

class LibraryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "library"
    verbose_name = "Library Management"
    
    def ready(self):
        try:
            import library.signals  # noqa
        except ImportError:
            pass