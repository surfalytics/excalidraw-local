# Library packs

Excalidraw library files (`.excalidrawlib`) from the official catalog at libraries.excalidraw.com. The canvas server serves this folder, and the app loads every pack into the library sidebar on start.

| File | Content |
|---|---|
| `post-it`, `simple-sticky-notes` | Sticky notes with shadow, in several colors |
| `aws-architecture-icons`, `aws-serverless-icons-v2` | AWS icons |
| `azure-compute`, `azure-storage`, `azure-network`, `azure-containers`, `azure-general` | Azure icons |
| `gcp-icons`, `original-google-architecture-icons` | GCP icons |
| `technology-logos` | Kafka, Snowflake, dbt, Airflow and other logos |
| `cloud-design-patterns` | Common cloud architecture patterns |

All packs are vector shapes. No image files. Sample renders are in `samples/`, one per pack.

## Use in the app

Open the library sidebar (book icon, top right). Click an item to stamp it on the canvas.

## Use from Claude Code or the terminal

```bash
node libs/stamp.mjs list                      # all 396 item names
node libs/stamp.mjs list s3                   # filter by substring
node libs/stamp.mjs add --item "S3" --x 400 --y 200
node libs/stamp.mjs add --item "sticky-green" --x 100 --y 100 --text "Call the bank"
node libs/stamp.mjs add --item "BigQuery" --x 800 --y 200 --scale 1.5
```

`--text` replaces the item's first text element, or adds a label under it.

## Add a pack

Drop any `.excalidrawlib` file in this folder and restart the app. To find more: https://libraries.excalidraw.com.
