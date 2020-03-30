import {OrderedSet} from "immutable";
import { structuredData } from "./test_data";
import {QueryGetAll, QueryWith, queryAnnotated, QueryOption, Segment, querySegment} from "../queries";
import {Annotation, Gene, GeneIndex, GeneIndexElement} from "../ingest";

describe("Annotation queries", () => {

  it("should return all annotations and genes that appear in them with FilterGetAll", () => {
    const query: QueryGetAll = { tag: "QueryGetAll" };

    const expectedGeneIndex: GeneIndex = structuredData.genes.index
      // There is a specific gene which does not belong to any annotations called ATBLAHBLAH.
      // This query should have all of the genes except that one.
      .filter((_, geneId) => geneId !== "ATBLAHBLAH");

    const queryResult = queryAnnotated(structuredData, query);
    expect(queryResult.genes.index).toEqual(expectedGeneIndex);
    expect(queryResult.annotations.records).toEqual(structuredData.annotations.records);
  });

  it("should query the correct genes and annotations for the single C:KNOWN_EXP segment", () => {
    const segment: Segment = {
      aspect: "C",
      annotationStatus: "KNOWN_EXP",
    };

    const expectedGeneIndex: GeneIndex = GeneIndex({
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
    });

    const queryResult = querySegment(structuredData, segment);
    const actualGeneIndex = queryResult.genes.index;
    expect(actualGeneIndex).toEqual(expectedGeneIndex);
  });

  it("should choose the proper subset for FilterWith:union for C:KNOWN_EXP", () => {
    const query: QueryWith = { tag: "QueryWith",
      strategy: "union",
      segments: [{ aspect: "C", annotationStatus: "KNOWN_EXP" }],
    };

    const expectedGeneIndex: GeneIndex = GeneIndex({
      AT4G18120: GeneIndexElement({
        gene: Gene({
          GeneID: "AT4G18120",
          GeneProductType: "pseudogene"
        }),
        annotations: OrderedSet([
          Annotation({ Db: '',
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
            GeneProductFormID: '' }),
        ])
      }),
    });

    const expectedAnnotations: OrderedSet<Annotation> = OrderedSet([
      Annotation({ Db: '',
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
        GeneProductFormID: '' }),
    ]);

    const queryResult = queryAnnotated(structuredData, query);
    expect(queryResult.genes.index).toEqual(expectedGeneIndex);
    expect(queryResult.annotations.records).toEqual(expectedAnnotations);
  });

  it("should choose a proper subset for FilterWith:union for C:KNOWN_OTHER", () => {
    const query: QueryWith = { tag: "QueryWith",
      strategy: "union",
      segments: [{ aspect: "C", annotationStatus: "KNOWN_OTHER" }],
    };

    const expectedGeneIndex: GeneIndex = GeneIndex({
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
        ]),
      }),
      AT1G08845: GeneIndexElement({
        gene: Gene({
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        }),
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
    });

    const expectedAnnotations: OrderedSet<Annotation> = OrderedSet([
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
    ]);

    const queryResult = queryAnnotated(structuredData, query);
    expect(queryResult.genes.index.toJS()).toEqual(expectedGeneIndex.toJS());

    // Note: convert from OrderedSet to Set when comparing equality
    expect(queryResult.annotations.records.toSet()).toEqual(expectedAnnotations.toSet());
  });

  it("should return the union of results when using FilterWith:union for C:KNOWN_OTHER,P:KNOWN_OTHER", () => {
    const query: QueryWith = { tag: "QueryWith",
      strategy: "union",
      segments: [
        { aspect: "C", annotationStatus: "KNOWN_OTHER" },
        { aspect: "P", annotationStatus: "KNOWN_OTHER" },
      ],
    };

    const expectedGeneIndex: GeneIndex = GeneIndex({
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
            GeneNames: OrderedSet([ 'AT5G40395', 'U6acat', '67751.snRNA00001' ]),
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
            Taxon: '',
            Date: "2018-11-01T00:00:00.000Z",
            AssignedBy: 'GOC',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' }),
        ])
      }),
    });

    const expectedAnnotations: OrderedSet<Annotation> = OrderedSet([
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
        GeneProductFormID: ''}),
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
        DatabaseID: 'locus:1005716828',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: OrderedSet([ '' ]),
        Aspect: 'P',
        GeneNames: OrderedSet([ 'AT5G40395', 'U6acat', '67751.snRNA00001' ]),
        UniqueGeneName: 'AT5G40395',
        AlternativeGeneName: OrderedSet([ 'AT5G40395', 'U6acat', '67751.snRNA00001' ]),
        GeneProductType: 'snRNA',
        Taxon: '',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' }),
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
        Taxon: '',
        Date: "2018-11-01T00:00:00.000Z",
        AssignedBy: 'GOC',
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
    ]);

    // Convert annotations lists to Sets in order to compare contents without order.
    const queriedDataset = queryAnnotated(structuredData, query);
    const genes = queriedDataset.genes.index;
    const outputAnnotationsSet = queriedDataset.annotations.records;
    const expectedAnnotationsSet = expectedAnnotations;

    expect(genes.toJS()).toEqual(expectedGeneIndex.toJS());

    // Note: convert from OrderedSet to Set when comparing equality
    expect(outputAnnotationsSet.toSet()).toEqual(expectedAnnotationsSet.toSet());
  });

  it("should find a single gene for QueryWith:intersection for C:KNOWN_OTHER,P:KNOWN_OTHER", () => {
    const query: QueryOption = { tag: "QueryWith",
      strategy: "intersection",
      segments: [
        { aspect: "C", annotationStatus: "KNOWN_OTHER" },
        { aspect: "P", annotationStatus: "KNOWN_OTHER" },
      ],
    };

    const expectedGeneIndex: GeneIndex = GeneIndex({
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
    });

    const queryResult = queryAnnotated(structuredData, query);
    const expectedAnnotations: OrderedSet<Annotation> = OrderedSet([
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
    ]);
    expect(queryResult.genes.index.toJS()).toEqual(expectedGeneIndex.toJS());
    expect(queryResult.annotations.records.toJS()).toEqual(expectedAnnotations.toJS());
  });
});
