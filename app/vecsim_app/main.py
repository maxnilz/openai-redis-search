import uvicorn
from aredis_om import (
    get_redis_connection,
    Migrator
)
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from vecsim_app import config
from vecsim_app.api import routes
from vecsim_app.models import Product

app = FastAPI(
    title=config.PROJECT_NAME,
    docs_url=config.API_DOCS,
    openapi_url=config.OPENAPI_DOCS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Routers
app.include_router(
    routes.product_router,
    prefix=config.API_V1_STR + "/product",
    tags=["products"]
)


@app.on_event("startup")
async def startup():
    # You can set the Redis OM URL using the REDIS_OM_URL environment
    # variable, or by manually creating the connection using your model's
    # Meta object.
    Product.Meta.database = get_redis_connection(url=config.REDIS_URL, decode_responses=True)
    await Migrator().run()


if __name__ == "__main__":
    import os

    env = os.environ.get("DEPLOYMENT", "prod")

    server_attr = {
        "host": "0.0.0.0",
        "reload": True,
        "port": 8888,
        "workers": 1
    }

    uvicorn.run("main:app", **server_attr)
