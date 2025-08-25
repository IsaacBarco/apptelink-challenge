from .owners import OwnerViewSet
from .pets import PetViewSet
from .services import ServiceViewSet
from .appointments import AppointmentViewSet
from .reports import ReportsViewSet
from .status import StatusView

__all__ = [
    'OwnerViewSet',
    'PetViewSet',
    'ServiceViewSet',
    'AppointmentViewSet',
    'ReportsViewSet',
    'StatusView',
]