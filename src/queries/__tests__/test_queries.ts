import { structuredData } from "./test_data";
import {QueryGetAll, QueryWith, queryAnnotated, QueryOption} from "../queries";

describe("Annotation queries", () => {

  it("should return all annotations and genes that appear in them with FilterGetAll", () => {
    const query: QueryGetAll = { tag: "QueryGetAll" };

    const expectedGeneMap = Object.entries(structuredData.geneIndex)
      // There is a specific gene which does not belong to any annotations called ATBLAHBLAH.
      // This query should have all of the genes except that one.
      .filter(([geneId, _]) => geneId !== "ATBLAHBLAH")
      .reduce((acc, [geneId, value]) => {
        acc[geneId] = value;
        return acc;
      }, {});

    expect(queryAnnotated(structuredData, query))
      .toEqual([expectedGeneMap, structuredData.annotations.records]);
  });

  it("should choose the proper subset for FilterWith:union for C:KNOWN_EXP", () => {
    const query: QueryWith = { tag: "QueryWith",
      strategy: "union",
      segments: [{ aspect: "C", annotationStatus: "KNOWN_EXP" }],
    };

    const expectedGeneMap = {
      AT4G18120: {
        gene: {
          GeneID: "AT4G18120",
          GeneProductType: "pseudogene"
        },
        annotations: new Set([
          { DatabaseID: 'locus:2117706',
            Invert: false,
            GOTerm: 'GO:0005634',
            Reference: 'TAIR:Publication:501713238|PMID:15356386',
            EvidenceCode: 'IDA',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            UniqueGeneName: 'AT4G18120',
            AlternativeGeneName: [
              'AT4G18120',
              'AML3',
              'ML3',
              'MEI2-like 3',
              'F15J5.90',
              'F15J5_90'
            ],
            GeneProductType: 'pseudogene',
            Date: "2006-05-19T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_EXP' }
        ])
      },
    };

    const expectedAnnotations = [
      { DatabaseID: 'locus:2117706',
        Invert: false,
        GOTerm: 'GO:0005634',
        Reference: 'TAIR:Publication:501713238|PMID:15356386',
        EvidenceCode: 'IDA',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        UniqueGeneName: 'AT4G18120',
        AlternativeGeneName: [
          'AT4G18120',
          'AML3',
          'ML3',
          'MEI2-like 3',
          'F15J5.90',
          'F15J5_90'
        ],
        GeneProductType: 'pseudogene',
        Date: "2006-05-19T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_EXP' }
    ];

    expect(queryAnnotated(structuredData, query))
      .toEqual([expectedGeneMap, expectedAnnotations]);
  });

  it("should choose a proper subset for FilterWith:union for C:KNOWN_OTHER", () => {
    const query: QueryWith = { tag: "QueryWith",
      strategy: "union",
      segments: [{ aspect: "C", annotationStatus: "KNOWN_OTHER" }],
    };

    const expectedGeneMap = {
      AT1G09440: {
        gene: {
          GeneID: "AT1G09440",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { DatabaseID: 'locus:2012325',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            UniqueGeneName: '',
            AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
      AT1G08845: {
        gene: {
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { DatabaseID: 'locus:1005716736',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
          { DatabaseID: 'locus:1111111111',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
    };

    const expectedAnnotations = [
      { DatabaseID: 'locus:2012325',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        UniqueGeneName: '',
        AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
        GeneProductType: 'protein',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:1005716736',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
    ];

    expect(queryAnnotated(structuredData, query))
      .toEqual([expectedGeneMap, expectedAnnotations]);
  });

  it("should return the union of results when using FilterWith:union for C:KNOWN_OTHER,P:KNOWN_OTHER", () => {
    const query: QueryWith = { tag: "QueryWith",
      strategy: "union",
      segments: [
        { aspect: "C", annotationStatus: "KNOWN_OTHER" },
        { aspect: "P", annotationStatus: "KNOWN_OTHER" },
      ],
    };

    const expectedGeneMap = {
      AT1G09440: {
        gene: {
          GeneID: "AT1G09440",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { DatabaseID: 'locus:2012325',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            UniqueGeneName: '',
            AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
      AT1G08845: {
        gene: {
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { DatabaseID: 'locus:1005716736',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
          { DatabaseID: 'locus:1111111111',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
      AT5G40395: {
        gene: {
          GeneID: "AT5G40395",
          GeneProductType: "small_nuclear_rna"
        },
        annotations: new Set([
          { DatabaseID: 'locus:1005716828',
            Invert: false,
            GOTerm: 'GO:0000398',
            Reference: 'TAIR:Publication:501682431',
            EvidenceCode: 'TAS',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            UniqueGeneName: 'AT5G40395',
            AlternativeGeneName: [ 'AT5G40395', 'U6acat', '67751.snRNA00001' ],
            GeneProductType: 'snRNA',
            Date: "2006-02-07T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
      AT5G46315: {
        gene: {
          GeneID: "AT5G46315",
          GeneProductType: "small_nuclear_rna"
        },
        annotations: new Set([
          { DatabaseID: 'locus:1005716827',
            Invert: false,
            GOTerm: 'GO:0000398',
            Reference: 'TAIR:Publication:501682431',
            EvidenceCode: 'TAS',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            UniqueGeneName: 'AT5G46315',
            AlternativeGeneName: [
              'AT5G46315',
              'U6-29',
              'U6 small nucleolar RNA29',
              '67796.snRNA00001'
            ],
            GeneProductType: 'snRNA',
            Date: "2006-02-07T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
      AT1G67070: {
        gene: {
          GeneID: "AT1G67070",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { DatabaseID: 'locus:2019748',
            Invert: false,
            GOTerm: 'GO:0000032',
            Reference: 'TAIR:Communication:501741973',
            EvidenceCode: 'IBA',
            AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
            Aspect: 'P',
            UniqueGeneName: 'AT1G67070',
            AlternativeGeneName: [
              'AT1G67070',
              'DIN9',
              'PMI2',
              'DARK INDUCIBLE 9',
              'PHOSPHOMANNOSE ISOMERASE 2',
              'F1O19.12',
              'F1O19_12'
            ],
            GeneProductType: 'protein',
            Date: "2018-06-15T00:00:00.000Z",
            AssignedBy: 'GOC',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
      AT3G02570: {
        gene: {
          GeneID: "AT3G02570",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { DatabaseID: 'locus:2076864',
            Invert: false,
            GOTerm: 'GO:0000032',
            Reference: 'TAIR:Communication:501741973',
            EvidenceCode: 'IBA',
            AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
            Aspect: 'P',
            UniqueGeneName: 'AT3G02570',
            AlternativeGeneName: [
              'AT3G02570',
              'MEE31',
              'PMI1',
              'MATERNAL EFFECT EMBRYO ARREST 31',
              'PHOSPHOMANNOSE ISOMERASE 1',
              'F16B3.20',
              'F16B3_20'
            ],
            GeneProductType: 'protein',
            Date: "2018-11-01T00:00:00.000Z",
            AssignedBy: 'GOC',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
    };

    const expectedAnnotations = [
      { DatabaseID: 'locus:2012325',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        UniqueGeneName: '',
        AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
        GeneProductType: 'protein',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:1005716736',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:1005716828',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        UniqueGeneName: 'AT5G40395',
        AlternativeGeneName: [ 'AT5G40395', 'U6acat', '67751.snRNA00001' ],
        GeneProductType: 'snRNA',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:1005716827',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        UniqueGeneName: 'AT5G46315',
        AlternativeGeneName: [
          'AT5G46315',
          'U6-29',
          'U6 small nucleolar RNA29',
          '67796.snRNA00001'
        ],
        GeneProductType: 'snRNA',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:2019748',
        Invert: false,
        GOTerm: 'GO:0000032',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
        Aspect: 'P',
        UniqueGeneName: 'AT1G67070',
        AlternativeGeneName: [
          'AT1G67070',
          'DIN9',
          'PMI2',
          'DARK INDUCIBLE 9',
          'PHOSPHOMANNOSE ISOMERASE 2',
          'F1O19.12',
          'F1O19_12'
        ],
        GeneProductType: 'protein',
        Date: "2018-06-15T00:00:00.000Z",
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:2076864',
        Invert: false,
        GOTerm: 'GO:0000032',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
        Aspect: 'P',
        UniqueGeneName: 'AT3G02570',
        AlternativeGeneName: [
          'AT3G02570',
          'MEE31',
          'PMI1',
          'MATERNAL EFFECT EMBRYO ARREST 31',
          'PHOSPHOMANNOSE ISOMERASE 1',
          'F16B3.20',
          'F16B3_20'
        ],
        GeneProductType: 'protein',
        Date: "2018-11-01T00:00:00.000Z",
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER' },
      { DatabaseID: 'locus:1111111111',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER' },
    ];

    // Convert annotations lists to Sets in order to compare contents without order.
    const [outputGeneMap, outputAnnotations] = queryAnnotated(structuredData, query);
    const outputAnnotationsSet = new Set(outputAnnotations);
    const expectedAnnotationsSet = new Set(expectedAnnotations);

    expect([outputGeneMap, outputAnnotationsSet])
      .toEqual([expectedGeneMap, expectedAnnotationsSet]);
  });

  it("should find a single gene for QueryWith:intersection for C:KNOWN_OTHER,P:KNOWN_OTHER", () => {
    const query: QueryOption = { tag: "QueryWith",
      strategy: "intersection",
      segments: [
        { aspect: "C", annotationStatus: "KNOWN_OTHER" },
        { aspect: "P", annotationStatus: "KNOWN_OTHER" },
      ],
    };

    const expectedGeneMap = {
      AT1G08845: {
        gene: {
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        },
        // Here, we add two annotations to a single gene that categorize it
        // under two different aspects. This is to test the intersection case.
        annotations: new Set([
          { DatabaseID: 'locus:1005716736',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
          { DatabaseID: 'locus:1111111111',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER' },
        ])
      },
    };

    const expectedAnnotations = [];

    expect(queryAnnotated(structuredData, query))
      .toEqual([expectedGeneMap, expectedAnnotations]);
  });
});
