import {OrderedSet} from "immutable";
import {GeneIndex, Annotation, StructuredData, indexAnnotations, Gene, GeneIndexElement} from "../ingest";

const partialGeneIndex: GeneIndex = GeneIndex({
  AT4G18120: GeneIndexElement({
    gene: Gene({
      GeneID: "AT4G18120",
      GeneProductType: "pseudogene"
    }),
    annotations: OrderedSet([
      Annotation({
        Db: '',
        DatabaseID: 'locus:2117706',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005634',
        Reference: 'TAIR:Publication:501713238|PMID:15356386',
        EvidenceCode: 'IDA',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'C',
        GeneNames: OrderedSet([
          'AT4G18120',
          'AML3',
          'ML3',
          'MEI2-like 3',
          'F15J5.90',
          'F15J5_90'
        ]),
        UniqueGeneName: 'AT4G18120',
        AlternativeGeneName: OrderedSet([
          'AT4G18120',
          'AML3',
          'ML3',
          'MEI2-like 3',
          'F15J5.90',
          'F15J5_90'
        ]),
        GeneProductType: 'pseudogene',
        Taxon: '',
        Date: "2006-05-19T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_EXP',
        AnnotationExtension: '',
        GeneProductFormID: '' })
    ])
  }),
  AT5G40395: GeneIndexElement({
    gene: Gene({
      GeneID: "AT5G40395",
      GeneProductType: "small_nuclear_rna"
    }),
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:1005716828',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'P',
        GeneNames: OrderedSet(['AT5G40395', 'U6acat', '67751.snRNA00001']),
        UniqueGeneName: 'AT5G40395',
        AlternativeGeneName: OrderedSet([ 'AT5G40395', 'U6acat', '67751.snRNA00001' ]),
        GeneProductType: 'snRNA',
        Taxon: '',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  AT5G46315: GeneIndexElement({
    gene: Gene({
      GeneID: "AT5G46315",
      GeneProductType: "small_nuclear_rna"
    }),
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:1005716827',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'P',
        GeneNames: OrderedSet([
          'AT5G46315',
          'U6-29',
          'U6 small nucleolar RNA29',
          '67796.snRNA00001'
        ]),
        UniqueGeneName: 'AT5G46315',
        AlternativeGeneName: OrderedSet([
          'AT5G46315',
          'U6-29',
          'U6 small nucleolar RNA29',
          '67796.snRNA00001'
        ]),
        GeneProductType: 'snRNA',
        Taxon: '',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  AT1G67070: GeneIndexElement({
    gene: Gene({
      GeneID: "AT1G67070",
      GeneProductType: "protein_coding"
    }),
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:2019748',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000032',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: OrderedSet([ 'PANTHER:PTN000034017', 'SGD:S000000805' ]),
        Aspect: 'P',
        GeneNames: OrderedSet([
          'AT1G67070',
          'DIN9',
          'PMI2',
          'DARK INDUCIBLE 9',
          'PHOSPHOMANNOSE ISOMERASE 2',
          'F1O19.12',
          'F1O19_12'
        ]),
        UniqueGeneName: 'AT1G67070',
        AlternativeGeneName: OrderedSet([
          'AT1G67070',
          'DIN9',
          'PMI2',
          'DARK INDUCIBLE 9',
          'PHOSPHOMANNOSE ISOMERASE 2',
          'F1O19.12',
          'F1O19_12'
        ]),
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-06-15T00:00:00.000Z",
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  AT3G02570: GeneIndexElement({
    gene: Gene({
      GeneID: "AT3G02570",
      GeneProductType: "protein_coding"
    }),
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:2076864',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000032',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: OrderedSet([ 'PANTHER:PTN000034017', 'SGD:S000000805' ]),
        Aspect: 'P',
        GeneNames: OrderedSet([
          'AT3G02570',
          'MEE31',
          'PMI1',
          'MATERNAL EFFECT EMBRYO ARREST 31',
          'PHOSPHOMANNOSE ISOMERASE 1',
          'F16B3.20',
          'F16B3_20'
        ]),
        UniqueGeneName: 'AT3G02570',
        AlternativeGeneName: OrderedSet([
          'AT3G02570',
          'MEE31',
          'PMI1',
          'MATERNAL EFFECT EMBRYO ARREST 31',
          'PHOSPHOMANNOSE ISOMERASE 1',
          'F16B3.20',
          'F16B3_20'
        ]),
        GeneProductType: 'protein',
        Date: "2018-11-01T00:00:00.000Z",
        Taxon: '',
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  AT1G65290: GeneIndexElement({
    gene: Gene({
      GeneID: "AT1G65290",
      GeneProductType: "protein_coding"
    }),
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:2206300',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000035',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: OrderedSet([ 'PANTHER:PTN000466551', 'EcoGene:EG50003', 'UniProtKB:P9WQF3' ]),
        Aspect: 'F',
        GeneNames: OrderedSet([
          'AT1G65290',
          'mtACP2',
          'mitochondrial acyl carrier protein 2',
          'T8F5.6',
          'T8F5_6'
        ]),
        UniqueGeneName: 'AT1G65290',
        AlternativeGeneName: OrderedSet([
          'AT1G65290',
          'mtACP2',
          'mitochondrial acyl carrier protein 2',
          'T8F5.6',
          'T8F5_6'
        ]),
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-03T00:00:00.000Z",
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  AT1G09440: GeneIndexElement({
    gene: Gene({
      GeneID: "AT1G09440",
      GeneProductType: "protein_coding"
    }),
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:2012325',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'C',
        GeneNames: OrderedSet([ 'AT1G09440', 'AT1G09440.2' ]),
        UniqueGeneName: '',
        AlternativeGeneName: OrderedSet([ 'AT1G09440', 'AT1G09440.2' ]),
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  AT1G08845: GeneIndexElement({
    gene: Gene({
      GeneID: "AT1G08845",
      GeneProductType: "protein_coding"
    }),
    // Here, we add two annotations to a single gene that categorize it
    // under two different aspects. This is to test the intersection case.
    annotations: OrderedSet([
      Annotation({ Db: '',
        DatabaseID: 'locus:1005716736',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'C',
        GeneNames: OrderedSet([ 'AT1G08845', 'AT1G08845.2' ]),
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: OrderedSet([ 'AT1G08845', 'AT1G08845.2' ]),
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
      Annotation({ Db: '',
        DatabaseID: 'locus:1111111111',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'P',
        GeneNames: OrderedSet([ 'AT1G08845', 'AT1G08845.2' ]),
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: OrderedSet([ 'AT1G08845', 'AT1G08845.2' ]),
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
    ])
  }),
  // This "gene" does not appear in any annotations
  ATBLAHBLAH: GeneIndexElement({
    gene: Gene({
      GeneID: "ATBLAHBLAH",
      GeneProductType: "Dummy",
    }),
    annotations: OrderedSet([]),
  }),
});

const annotationRecords: OrderedSet<Annotation> = partialGeneIndex.valueSeq()
  .flatMap((value) => value.get("annotations"))
  .toOrderedSet();

const { annotationIndex, geneIndex } = indexAnnotations(partialGeneIndex, annotationRecords);

export const structuredData: StructuredData = {
  raw: {
    genesText: "genes raw data",
    annotationsText: "annotations raw data",
  },
  annotations: {
    metadata: "!annotation metadata",
    header: "Column A, Column B, Column C",
    records: annotationRecords,
    index: annotationIndex,
  },
  genes: {
    metadata: "!gene metadata",
    header: "gene_id, gene_product_type",
    records: OrderedSet(),
    index: geneIndex,
  },
};

describe("the test data", () => {
  it("should have the same number of annotations in the GeneIndex and the annotations list", () => {
    const annotationCountInGeneMap = geneIndex.valueSeq()
      .flatMap(value => value.get("annotations")).toOrderedSet().size;
    expect(annotationCountInGeneMap).toEqual(annotationRecords.size);
  });

  it("should produce the correct GeneIndex", () => {
    expect(geneIndex).toEqual(partialGeneIndex);
  });
});
