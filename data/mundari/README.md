# Hindi-Mundari Corpus Integration

The Mundari offline core uses the external [Karya Hindi-Mundari Translation Dataset](https://github.com/karya-inc/dataset-hindi-mundari-translation). The source corpus is retained unchanged under `source/`; it is not NeuroPathshala-created data.

## Pipeline

```text
translation-hi-unr.tsv
    -> UTF-8/column validation
    -> whitespace normalization and malformed-record removal
    -> exact pair deduplication
    -> deterministic normalized lookup index
    -> classroom keyword filtering for resource cards
    -> existing NeuroPathshala local translation provider
```

Regenerate the checked-in processed artifacts with:

```bash
npm run process:mundari
```

The full normalized index is generated for local lookup, while the classroom phrase file is the smaller resource-library subset. The provider is an exact/normalized lookup, not a neural machine translation model. Unknown phrases remain unsupported and are eligible for the existing online path only when the device is online.

## Attribution and license

The source corpus was created by Microsoft Research India, IIT Kharagpur, and Karya in collaboration with the FAIR Forward project. The original `LICENSE.txt` and `COPYRIGHT.txt` are preserved in `source/`.

The Karya Attribution-NonCommercial-ShareAlike-FreeSoftware 1.0 license requires attribution and restricts use to non-commercial purposes, with share-alike and Free Software conditions. Commercial distribution of NeuroPathshala must be reviewed for license compatibility before release.