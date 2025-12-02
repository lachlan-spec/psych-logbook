"""
Simple, explicit database connection for Azure Cosmos DB (MongoDB API)

Following successful guide principles:
- ✅ Simple and explicit
- ✅ No auto-discovery
- ✅ Clear error messages
- ✅ Environment-based configuration
"""

import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

logger = logging.getLogger(__name__)

# Global connection (reused across function invocations)
_client = None
_db = None


def get_database():
    """
    Get MongoDB database instance with simple, explicit configuration.
    
    Returns:
        Database: MongoDB database instance
        
    Raises:
        ValueError: If connection string not configured
        ConnectionFailure: If cannot connect to database
    """
    global _client, _db
    
    if _db is not None:
        return _db
    
    # Get connection string from environment
    connection_string = os.environ.get('COSMOS_CONNECTION_STRING')
    
    if not connection_string:
        error_msg = (
            "COSMOS_CONNECTION_STRING not configured. "
            "Set it in Function App → Configuration → Application settings"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    # Get explicit database name
    db_name = os.environ.get('DB_NAME', 'regpath_production')
    
    logger.info(f"=" * 80)
    logger.info(f"DATABASE CONNECTION CONFIGURATION")
    logger.info(f"  Database name: {db_name}")
    logger.info(f"  Connection: Azure Cosmos DB (MongoDB API)")
    logger.info(f"  Note: Database will be created automatically on first write")
    logger.info(f"=" * 80)
    
    try:
        # Create MongoDB client
        _client = MongoClient(
            connection_string,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000
        )
        
        # Test connection
        _client.server_info()
        logger.info(f"✓ Successfully connected to Cosmos DB")
        
        # Get database (Cosmos DB creates it on first write if doesn't exist)
        _db = _client[db_name]
        logger.info(f"✓ Database '{db_name}' ready")
        
        return _db
        
    except ConnectionFailure as e:
        error_msg = f"Failed to connect to Cosmos DB: {str(e)}"
        logger.error(error_msg)
        raise ConnectionFailure(error_msg)
    except OperationFailure as e:
        error_msg = f"Database operation failed: {str(e)}"
        logger.error(error_msg)
        raise OperationFailure(error_msg)
    except Exception as e:
        error_msg = f"Unexpected database error: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)


def close_database():
    """Close database connection (called on function app shutdown)"""
    global _client, _db
    
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("Database connection closed")
