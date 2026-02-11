from django.apps import AppConfig


class ComparisonsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'comparisons'

    def ready(self):
        import comparisons.signals
