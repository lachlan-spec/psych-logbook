"""
Health check endpoint for Azure Functions
Tests database connectivity and returns system status
"""

import azure.functions as func
import json
import logging
from shared_code.database import get_database

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint"""
    logger.info('Health check requested')
    
    try:
        # Test database connection
        db = get_database()
        
        # Simple ping to verify connection
        db.command('ping')
        
        return func.HttpResponse(
            json.dumps({
                "status": "healthy",
                "database": "connected",
                "service": "regpath-portal-api"
            }),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "status": "unhealthy",
                "error": str(e)
            }),
            mimetype="application/json",
            status_code=503
        )
