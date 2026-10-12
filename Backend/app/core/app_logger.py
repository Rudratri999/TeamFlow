import logging

logger = logging.getLogger("teamflow")
logger.setLevel(logging.INFO)

# We create this to reduce the use of print , we can use logger.info("project created")