import { RequestHandler } from "express";
import { fortsData, Fort } from "../data/forts";
import { FortInfoModel } from "../database/models";
import { fallbackForts, fallbackDistricts, fallbackDifficulties, fallbackStats } from "../data/fallback-data";

// GET /api/forts - Get all forts with optional filtering
export const getAllForts: RequestHandler = (req, res) => {
  try {
    const { 
      search, 
      district, 
      difficulty, 
      minRating, 
      sortBy = 'name',
      limit,
      offset = '0' 
    } = req.query;

    let filteredForts = [...fortsData];

    // Search filter
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      filteredForts = filteredForts.filter(fort => 
        fort.name.toLowerCase().includes(searchTerm) ||
        fort.location.toLowerCase().includes(searchTerm) ||
        fort.description.toLowerCase().includes(searchTerm) ||
        fort.highlights.some(highlight => 
          highlight.toLowerCase().includes(searchTerm)
        )
      );
    }

    // District filter
    if (district && typeof district === 'string' && district !== 'all') {
      filteredForts = filteredForts.filter(fort => 
        fort.district.toLowerCase() === district.toLowerCase()
      );
    }

    // Difficulty filter
    if (difficulty && typeof difficulty === 'string' && difficulty !== 'all') {
      filteredForts = filteredForts.filter(fort => 
        fort.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Rating filter
    if (minRating && !isNaN(Number(minRating))) {
      filteredForts = filteredForts.filter(fort => 
        fort.rating >= Number(minRating)
      );
    }

    // Sorting
    if (typeof sortBy === 'string') {
      filteredForts.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'rating':
            return b.rating - a.rating;
          case 'elevation':
            return b.elevation - a.elevation;
          case 'difficulty':
            const difficultyOrder = { 'Easy': 1, 'Moderate': 2, 'Difficult': 3, 'Expert': 4 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          case 'reviews':
            return b.reviews - a.reviews;
          default:
            return 0;
        }
      });
    }

    // Pagination
    const startIndex = parseInt(offset as string) || 0;
    const endIndex = limit ? startIndex + parseInt(limit as string) : filteredForts.length;
    const paginatedForts = filteredForts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedForts,
      total: filteredForts.length,
      page: Math.floor(startIndex / (limit ? parseInt(limit as string) : filteredForts.length)) + 1,
      totalPages: limit ? Math.ceil(filteredForts.length / parseInt(limit as string)) : 1
    });
  } catch (error) {
    console.error('Error in getAllForts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/forts/:id - Get single fort by ID
export const getFortById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const fortId = parseInt(id);

    if (isNaN(fortId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fort ID'
      });
    }

    // Check if it's a regular fort (ID < 10000)
    if (fortId < 10000) {
      const fort = fortsData.find(f => f.id === fortId);

      if (!fort) {
        return res.status(404).json({
          success: false,
          message: 'Fort not found'
        });
      }

      return res.json({
        success: true,
        data: fort
      });
    }

    // For approved forts (ID >= 10000), get from database
    const approvedFortId = fortId - 10000; // Remove the offset
    const approvedForts = await FortInfoModel.getApproved();
    const approvedFort = approvedForts.find(f => f.id === approvedFortId);

    if (!approvedFort) {
      return res.status(404).json({
        success: false,
        message: 'Fort not found'
      });
    }

    // Convert approved fort to the same format as regular forts
    const convertedFort = {
      id: approvedFort.id + 10000, // Add back the offset
      name: approvedFort.fort_name,
      location: approvedFort.location,
      district: 'User Submitted',
      difficulty: approvedFort.difficulty || 'Moderate',
      duration: approvedFort.duration || 'Not specified',
      rating: 4.0,
      reviews: 0,
      elevation: 1000,
      bestSeason: ['Oct-Mar'],
      images: {
        main: approvedFort.images && approvedFort.images.length > 0 ?
          `/uploads/fort-images/${approvedFort.images[0]}` : '/placeholder.svg',
        gallery: approvedFort.images ?
          approvedFort.images.map((img: string) => `/uploads/fort-images/${img}`) : []
      },
      description: approvedFort.description || 'User submitted fort information.',
      highlights: [
        'User submitted content',
        ...(approvedFort.best_time_to_visit ? [`Best time: ${approvedFort.best_time_to_visit}`] : []),
        ...(approvedFort.entry_fee ? [`Entry fee: ${approvedFort.entry_fee}`] : [])
      ],
      nearestTown: approvedFort.location.split(',')[0] || 'Not specified',
      distance: 10,
      history: 'Historical information submitted by community.',
      architecture: 'Architectural details to be updated.',
      trekRoute: 'Trek route information to be updated.',
      whatToBring: ['Water', 'Comfortable shoes', 'Camera'],
      safetyTips: approvedFort.safety_tips ?
        approvedFort.safety_tips.split(',').map((tip: string) => tip.trim()) :
        ['Follow local guidelines', 'Trek in groups'],
      accessibility: {
        byTrain: 'Contact local guides for transportation details',
        byBus: 'Contact local guides for transportation details',
        byAir: 'Contact local guides for transportation details'
      },
      weather: {
        temperature: '15°C - 30°C',
        rainfall: 'Moderate during monsoon',
        bestTime: approvedFort.best_time_to_visit || 'October to March'
      },
      facilities: {
        parking: approvedFort.facilities ? approvedFort.facilities.includes('parking') : false,
        restrooms: approvedFort.facilities ? approvedFort.facilities.includes('restroom') : false,
        foodStalls: approvedFort.facilities ? approvedFort.facilities.includes('food') : false,
        guides: true
      },
      coordinates: {
        latitude: 18.5204,
        longitude: 73.8567
      },
      timings: '6:00 AM - 6:00 PM',
      entryFee: approvedFort.entry_fee || 'Contact local authorities',
      photography: true,
      createdAt: new Date(approvedFort.created_at || Date.now()),
      updatedAt: new Date(approvedFort.updated_at || Date.now())
    };

    res.json({
      success: true,
      data: convertedFort
    });
  } catch (error) {
    console.error('Error in getFortById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/forts/featured - Get featured forts
export const getFeaturedForts: RequestHandler = (req, res) => {
  try {
    // Get top 3 forts by rating
    const featuredForts = fortsData
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);

    res.json({
      success: true,
      data: featuredForts
    });
  } catch (error) {
    console.error('Error in getFeaturedForts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/forts/districts - Get all unique districts
export const getDistricts: RequestHandler = (req, res) => {
  try {
    const districts = [...new Set(fortsData.map(fort => fort.district))].sort();
    
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Error in getDistricts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/forts/difficulties - Get all difficulty levels
export const getDifficulties: RequestHandler = (req, res) => {
  try {
    const difficulties = ['Easy', 'Moderate', 'Difficult', 'Expert'];
    
    res.json({
      success: true,
      data: difficulties
    });
  } catch (error) {
    console.error('Error in getDifficulties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/forts/stats - Get overall statistics
export const getFortsStats: RequestHandler = (req, res) => {
  try {
    const stats = {
      totalForts: fortsData.length,
      totalDistricts: new Set(fortsData.map(fort => fort.district)).size,
      totalReviews: fortsData.reduce((sum, fort) => sum + fort.reviews, 0),
      averageRating: fortsData.reduce((sum, fort) => sum + fort.rating, 0) / fortsData.length,
      difficultyDistribution: {
        Easy: fortsData.filter(f => f.difficulty === 'Easy').length,
        Moderate: fortsData.filter(f => f.difficulty === 'Moderate').length,
        Difficult: fortsData.filter(f => f.difficulty === 'Difficult').length,
        Expert: fortsData.filter(f => f.difficulty === 'Expert').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getFortsStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /api/forts/search/suggestions - Get search suggestions
export const getSearchSuggestions: RequestHandler = (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = q.toLowerCase();
    const suggestions = new Set<string>();

    fortsData.forEach(fort => {
      // Add fort names
      if (fort.name.toLowerCase().includes(query)) {
        suggestions.add(fort.name);
      }
      
      // Add locations
      if (fort.location.toLowerCase().includes(query)) {
        suggestions.add(fort.location);
      }
      
      // Add districts
      if (fort.district.toLowerCase().includes(query)) {
        suggestions.add(fort.district);
      }
      
      // Add highlights
      fort.highlights.forEach(highlight => {
        if (highlight.toLowerCase().includes(query)) {
          suggestions.add(highlight);
        }
      });
    });

    const limitedSuggestions = Array.from(suggestions).slice(0, 10);

    res.json({
      success: true,
      data: limitedSuggestions
    });
  } catch (error) {
    console.error('Error in getSearchSuggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
