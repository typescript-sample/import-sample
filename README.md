# import-sample

## Import flow
![Import flow with data validation](https://camo.githubusercontent.com/2021d4866008fc6cb1fdd126d7a8a50c2d294b52315f902dbe81675bf5eeda0a/68747470733a2f2f63646e2d696d616765732d312e6d656469756d2e636f6d2f6d61782f3830302f312a524b5f577a656534307a794d42504b6f6774617437512e706e67)

## Common Architectures
### Layer Architecture
- Popular for web development

![Layer Architecture](https://camo.githubusercontent.com/d9b21eb50ef70dcaebf5a874559608f475e22c799bc66fcf99fb01f08576540f/68747470733a2f2f63646e2d696d616765732d312e6d656469756d2e636f6d2f6d61782f3830302f312a4a4459546c4b3030796730496c556a5a392d737037512e706e67)

### Hexagonal Architecture
- Suitable for Import Flow

![Hexagonal Architecture](https://camo.githubusercontent.com/1efb95a3c10b9a156c75126f9e32ae27c931f8de3ab2fbb132d88fdf25655df2/68747470733a2f2f63646e2d696d616765732d312e6d656469756d2e636f6d2f6d61782f3830302f312a6e4d75355f6a5a4a316f6d7a494235564b354c682d772e706e67)

#### Based on the flow, there are 4 main components (4 main ports):
- Reader. Adapter Sample: File Reader
- Validator. Adapter Sample: Schema Validator
- Transformer. Adapter Samples: Delimiter Transformer, Fix Length Transformer
- Writer. Adapter Samples: Mongo Writer, SQL Writer (insert, update, upsert...) 
