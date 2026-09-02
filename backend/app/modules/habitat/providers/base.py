import abc
from typing import Dict, Any, Optional

class SatelliteProvider(abc.ABC):
    @abc.abstractmethod
    def fetch_vegetation_index(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        pass

