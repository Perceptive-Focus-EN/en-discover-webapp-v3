import { InstituteRoles } from "./instituteRoles";


export enum InstituteTypes {
    // Higher Education
    UNIVERSITY = 'UNIVERSITY',
    COLLEGE = 'COLLEGE',
    COMMUNITY_COLLEGE = 'COMMUNITY_COLLEGE',
    TECHNICAL_COLLEGE = 'TECHNICAL_COLLEGE',
    LIBERAL_ARTS_COLLEGE = 'LIBERAL_ARTS_COLLEGE',
    GRADUATE_SCHOOL = 'GRADUATE_SCHOOL',
    LAW_SCHOOL = 'LAW_SCHOOL',
    MEDICAL_SCHOOL = 'MEDICAL_SCHOOL',
    BUSINESS_SCHOOL = 'BUSINESS_SCHOOL',

    // K-12 Education
    ELEMENTARY_SCHOOL = 'ELEMENTARY_SCHOOL',
    MIDDLE_SCHOOL = 'MIDDLE_SCHOOL',
    HIGH_SCHOOL = 'HIGH_SCHOOL',
    CHARTER_SCHOOL = 'CHARTER_SCHOOL',
    MAGNET_SCHOOL = 'MAGNET_SCHOOL',
    PRIVATE_SCHOOL = 'PRIVATE_SCHOOL',
    BOARDING_SCHOOL = 'BOARDING_SCHOOL',
    MONTESSORI_SCHOOL = 'MONTESSORI_SCHOOL',
    WALDORF_SCHOOL = 'WALDORF_SCHOOL',

    // Vocational and Adult Education
    VOCATIONAL_SCHOOL = 'VOCATIONAL_SCHOOL',
    TRADE_SCHOOL = 'TRADE_SCHOOL',
    ADULT_EDUCATION_CENTER = 'ADULT_EDUCATION_CENTER',
    CONTINUING_EDUCATION_INSTITUTE = 'CONTINUING_EDUCATION_INSTITUTE',
    LANGUAGE_SCHOOL = 'LANGUAGE_SCHOOL',

    // Special Education
    SPECIAL_EDUCATION_SCHOOL = 'SPECIAL_EDUCATION_SCHOOL',
    GIFTED_EDUCATION_INSTITUTE = 'GIFTED_EDUCATION_INSTITUTE',

    // Research Institutes
    RESEARCH_INSTITUTE = 'RESEARCH_INSTITUTE',
    THINK_TANK = 'THINK_TANK',
    POLICY_INSTITUTE = 'POLICY_INSTITUTE',
    SCIENTIFIC_INSTITUTE = 'SCIENTIFIC_INSTITUTE',
    SOCIAL_SCIENCE_INSTITUTE = 'SOCIAL_SCIENCE_INSTITUTE',

    // Professional Training
    POLICE_ACADEMY = 'POLICE_ACADEMY',
    FIRE_ACADEMY = 'FIRE_ACADEMY',
    MILITARY_ACADEMY = 'MILITARY_ACADEMY',
    FLIGHT_SCHOOL = 'FLIGHT_SCHOOL',
    CULINARY_INSTITUTE = 'CULINARY_INSTITUTE',

    // Arts and Culture
    ART_SCHOOL = 'ART_SCHOOL',
    MUSIC_CONSERVATORY = 'MUSIC_CONSERVATORY',
    DANCE_ACADEMY = 'DANCE_ACADEMY',
    FILM_SCHOOL = 'FILM_SCHOOL',
    THEATER_INSTITUTE = 'THEATER_INSTITUTE',

    // Technology and Innovation
    TECHNOLOGY_INSTITUTE = 'TECHNOLOGY_INSTITUTE',
    INNOVATION_CENTER = 'INNOVATION_CENTER',
    CODING_BOOTCAMP = 'CODING_BOOTCAMP',

    // Healthcare and Medicine
    NURSING_SCHOOL = 'NURSING_SCHOOL',
    DENTAL_SCHOOL = 'DENTAL_SCHOOL',
    PHARMACY_SCHOOL = 'PHARMACY_SCHOOL',
    PUBLIC_HEALTH_INSTITUTE = 'PUBLIC_HEALTH_INSTITUTE',

    // Religious Education
    SEMINARY = 'SEMINARY',
    YESHIVA = 'YESHIVA',
    MADRASA = 'MADRASA',

    // Online Education
    ONLINE_EDUCATION = 'ONLINE_EDUCATION',

    // Other
    TUTORING_CENTER = 'TUTORING_CENTER',
    ALTERNATIVE_EDUCATION = 'ALTERNATIVE_EDUCATION',

    // Generic
    OTHER = 'OTHER',
    InstituteTypes = "InstituteTypes"
}

export enum BaseInstituteTypes {
    HIGHER_EDUCATION = 'HIGHER_EDUCATION',
    K12_EDUCATION = 'K12_EDUCATION',
    VOCATIONAL_EDUCATION = 'VOCATIONAL_EDUCATION',
    ADULT_EDUCATION = 'ADULT_EDUCATION',
    SPECIAL_EDUCATION = 'SPECIAL_EDUCATION',
    RESEARCH_INSTITUTE = 'RESEARCH_INSTITUTE',
    PROFESSIONAL_TRAINING = 'PROFESSIONAL_TRAINING',
    ARTS_AND_CULTURE = 'ARTS_AND_CULTURE',
    TECHNOLOGY_AND_INNOVATION = 'TECHNOLOGY_AND_INNOVATION',
    HEALTHCARE_AND_MEDICINE = 'HEALTHCARE_AND_MEDICINE',
    RELIGIOUS_EDUCATION = 'RELIGIOUS_EDUCATION',
    ONLINE_EDUCATION = 'ONLINE_EDUCATION',
    ALTERNATIVE_EDUCATION = 'ALTERNATIVE_EDUCATION',
    OTHER = 'OTHER'
}

// Mapping BaseInstituteTypes to their corresponding Roles
export const BaseInstituteTypeToRoles: Record<BaseInstituteTypes, keyof typeof InstituteRoles> = {
    [BaseInstituteTypes.HIGHER_EDUCATION]: 'HigherEducation',
    [BaseInstituteTypes.K12_EDUCATION]: 'K_12',
    [BaseInstituteTypes.VOCATIONAL_EDUCATION]: 'VocationalAndAdultEducation',
    [BaseInstituteTypes.ADULT_EDUCATION]: 'VocationalAndAdultEducation',
    [BaseInstituteTypes.SPECIAL_EDUCATION]: 'SpecialEducation',
    [BaseInstituteTypes.RESEARCH_INSTITUTE]: 'ResearchInstitutes',
    [BaseInstituteTypes.PROFESSIONAL_TRAINING]: 'ProfessionalTrainingEducation',
    [BaseInstituteTypes.ARTS_AND_CULTURE]: 'HigherEducation',
    [BaseInstituteTypes.TECHNOLOGY_AND_INNOVATION]: 'HigherEducation',
    [BaseInstituteTypes.HEALTHCARE_AND_MEDICINE]: 'HigherEducation',
    [BaseInstituteTypes.RELIGIOUS_EDUCATION]: 'HigherEducation',
    [BaseInstituteTypes.ONLINE_EDUCATION]: 'AlternativeEducation',
    [BaseInstituteTypes.ALTERNATIVE_EDUCATION]: 'AlternativeEducation',
    [BaseInstituteTypes.OTHER]: 'HigherEducation'
};

// Mapping specific InstituteTypes to BaseInstituteTypes
export const InstituteTypeToBaseType: Record<InstituteTypes, BaseInstituteTypes> = {
    [InstituteTypes.UNIVERSITY]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.COLLEGE]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.COMMUNITY_COLLEGE]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.TECHNICAL_COLLEGE]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.LIBERAL_ARTS_COLLEGE]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.GRADUATE_SCHOOL]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.LAW_SCHOOL]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.MEDICAL_SCHOOL]: BaseInstituteTypes.HIGHER_EDUCATION,
    [InstituteTypes.BUSINESS_SCHOOL]: BaseInstituteTypes.HIGHER_EDUCATION,

    [InstituteTypes.ELEMENTARY_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.MIDDLE_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.HIGH_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.CHARTER_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.MAGNET_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.PRIVATE_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.BOARDING_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.MONTESSORI_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,
    [InstituteTypes.WALDORF_SCHOOL]: BaseInstituteTypes.K12_EDUCATION,

    [InstituteTypes.VOCATIONAL_SCHOOL]: BaseInstituteTypes.VOCATIONAL_EDUCATION,
    [InstituteTypes.TRADE_SCHOOL]: BaseInstituteTypes.VOCATIONAL_EDUCATION,
    [InstituteTypes.ADULT_EDUCATION_CENTER]: BaseInstituteTypes.ADULT_EDUCATION,
    [InstituteTypes.CONTINUING_EDUCATION_INSTITUTE]: BaseInstituteTypes.ADULT_EDUCATION,
    [InstituteTypes.LANGUAGE_SCHOOL]: BaseInstituteTypes.ADULT_EDUCATION,

    [InstituteTypes.SPECIAL_EDUCATION_SCHOOL]: BaseInstituteTypes.SPECIAL_EDUCATION,
    [InstituteTypes.GIFTED_EDUCATION_INSTITUTE]: BaseInstituteTypes.SPECIAL_EDUCATION,

    [InstituteTypes.RESEARCH_INSTITUTE]: BaseInstituteTypes.RESEARCH_INSTITUTE,
    [InstituteTypes.THINK_TANK]: BaseInstituteTypes.RESEARCH_INSTITUTE,
    [InstituteTypes.POLICY_INSTITUTE]: BaseInstituteTypes.RESEARCH_INSTITUTE,
    [InstituteTypes.SCIENTIFIC_INSTITUTE]: BaseInstituteTypes.RESEARCH_INSTITUTE,
    [InstituteTypes.SOCIAL_SCIENCE_INSTITUTE]: BaseInstituteTypes.RESEARCH_INSTITUTE,

    [InstituteTypes.POLICE_ACADEMY]: BaseInstituteTypes.PROFESSIONAL_TRAINING,
    [InstituteTypes.FIRE_ACADEMY]: BaseInstituteTypes.PROFESSIONAL_TRAINING,
    [InstituteTypes.MILITARY_ACADEMY]: BaseInstituteTypes.PROFESSIONAL_TRAINING,
    [InstituteTypes.FLIGHT_SCHOOL]: BaseInstituteTypes.PROFESSIONAL_TRAINING,
    [InstituteTypes.CULINARY_INSTITUTE]: BaseInstituteTypes.PROFESSIONAL_TRAINING,

    [InstituteTypes.ART_SCHOOL]: BaseInstituteTypes.ARTS_AND_CULTURE,
    [InstituteTypes.MUSIC_CONSERVATORY]: BaseInstituteTypes.ARTS_AND_CULTURE,
    [InstituteTypes.DANCE_ACADEMY]: BaseInstituteTypes.ARTS_AND_CULTURE,
    [InstituteTypes.FILM_SCHOOL]: BaseInstituteTypes.ARTS_AND_CULTURE,
    [InstituteTypes.THEATER_INSTITUTE]: BaseInstituteTypes.ARTS_AND_CULTURE,

    [InstituteTypes.TECHNOLOGY_INSTITUTE]: BaseInstituteTypes.TECHNOLOGY_AND_INNOVATION,
    [InstituteTypes.INNOVATION_CENTER]: BaseInstituteTypes.TECHNOLOGY_AND_INNOVATION,
    [InstituteTypes.CODING_BOOTCAMP]: BaseInstituteTypes.TECHNOLOGY_AND_INNOVATION,

    [InstituteTypes.NURSING_SCHOOL]: BaseInstituteTypes.HEALTHCARE_AND_MEDICINE,
    [InstituteTypes.DENTAL_SCHOOL]: BaseInstituteTypes.HEALTHCARE_AND_MEDICINE,
    [InstituteTypes.PHARMACY_SCHOOL]: BaseInstituteTypes.HEALTHCARE_AND_MEDICINE,
    [InstituteTypes.PUBLIC_HEALTH_INSTITUTE]: BaseInstituteTypes.HEALTHCARE_AND_MEDICINE,

    [InstituteTypes.SEMINARY]: BaseInstituteTypes.RELIGIOUS_EDUCATION,
    [InstituteTypes.YESHIVA]: BaseInstituteTypes.RELIGIOUS_EDUCATION,
    [InstituteTypes.MADRASA]: BaseInstituteTypes.RELIGIOUS_EDUCATION,


    [InstituteTypes.TUTORING_CENTER]: BaseInstituteTypes.ALTERNATIVE_EDUCATION,
    [InstituteTypes.ONLINE_EDUCATION]: BaseInstituteTypes.ONLINE_EDUCATION,
    [InstituteTypes.ALTERNATIVE_EDUCATION]: BaseInstituteTypes.ALTERNATIVE_EDUCATION,

    [InstituteTypes.OTHER]: BaseInstituteTypes.OTHER,
    [InstituteTypes.InstituteTypes]: BaseInstituteTypes.OTHER
};




// Function to get Roles for a specific InstituteType
export function getRolesForInstituteType(instituteType: InstituteTypes) {
    const baseType = InstituteTypeToBaseType[instituteType];
    const titleCategory = BaseInstituteTypeToRoles[baseType];
    return InstituteRoles[titleCategory];
}

// New function to get base type for a specific InstituteType
export function getBaseTypeForInstituteType(instituteType: InstituteTypes): BaseInstituteTypes {
    return InstituteTypeToBaseType[instituteType];
}

// New function to get all InstituteTypes for a given BaseInstituteType
export function getInstituteTypesForBaseType(baseType: BaseInstituteTypes): InstituteTypes[] {
    return Object.entries(InstituteTypeToBaseType)
        .filter(([_, value]) => value === baseType)
        .map(([key, _]) => key as InstituteTypes);
}

export { InstituteRoles };
